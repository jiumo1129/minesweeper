import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  ActivityIndicator,
  FlatList,
  TextInput,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  SONGS,
  PLAYLIST_NAME,
  PLAYLIST_SONG_COUNT,
  type Song,
} from "@/constants/playlist";
import { resolveCurrentSong, type WebViewPlayStateMessage } from "@/lib/music-player-state";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildPlayerUrl(songId?: number): string {
  if (songId) {
    return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=1&height=66`;
  }
  return `https://music.163.com/outchain/player?type=0&id=2116638139&auto=0&height=66`;
}

// JS injected into WebView to monitor play/pause state
const INJECTED_JS = `
(function() {
  function getSongIdFromAudio(audio) {
    if (!audio || !audio.currentSrc) return null;
    var match = audio.currentSrc.match(/[?&]id=(\d+)/);
    if (!match) return null;
    var id = parseInt(match[1], 10);
    return Number.isNaN(id) ? null : id;
  }

  function postState(playing, audio) {
    var songId = getSongIdFromAudio(audio);
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'playState', playing: playing, songId: songId || undefined })
    );
  }

  // Poll for audio element every 500ms
  var pollInterval = setInterval(function() {
    var audios = document.querySelectorAll('audio');
    if (audios.length === 0) return;

    audios.forEach(function(audio) {
      if (audio._rn_patched) return;
      audio._rn_patched = true;

      audio.addEventListener('play', function() { postState(true, audio); });
      audio.addEventListener('pause', function() { postState(false, audio); });
      audio.addEventListener('ended', function() { postState(false, audio); });

      // Report initial state
      postState(!audio.paused, audio);
    });
  }, 500);

  // Also watch for dynamically added audio elements
  var observer = new MutationObserver(function() {
    var audios = document.querySelectorAll('audio');
    audios.forEach(function(audio) {
      if (audio._rn_patched) return;
      audio._rn_patched = true;
      audio.addEventListener('play', function() { postState(true, audio); });
      audio.addEventListener('pause', function() { postState(false, audio); });
      audio.addEventListener('ended', function() { postState(false, audio); });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  true;
})();
`;

// Commands to inject for play/pause control
const JS_PLAY = `
(function() {
  var audio = document.querySelector('audio');
  if (audio) { audio.play(); }
  true;
})();
`;

const JS_PAUSE = `
(function() {
  var audio = document.querySelector('audio');
  if (audio) { audio.pause(); }
  true;
})();
`;

export interface MusicPlayerHandle {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
}

interface MusicPlayerProps {
  visible: boolean;
  onClose: () => void;
  onPlayStateChange?: (isPlaying: boolean, song: Song | null) => void;
}

export const MusicPlayer = forwardRef<MusicPlayerHandle, MusicPlayerProps>(
  function MusicPlayer({ visible, onClose, onPlayStateChange }, ref) {
    const insets = useSafeAreaInsets();
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    // -1 means "play all" (playlist mode), >= 0 means specific song index in SONGS
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedSong = currentIndex >= 0 ? SONGS[currentIndex] ?? null : null;

    // Clear auto-next timer
    const clearAutoNextTimer = useCallback(() => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    }, []);

    // Schedule auto-next after song duration + 3s buffer
    const scheduleAutoNext = useCallback(
      (song: Song | null) => {
        clearAutoNextTimer();
        if (!song) return; // playlist mode: netease handles auto-next internally
        const delayMs = (song.duration + 3) * 1000;
        autoNextTimerRef.current = setTimeout(() => {
          setCurrentIndex((prev) => {
            const nextIdx = prev < 0 ? 0 : (prev + 1) % SONGS.length;
            const nextSong = SONGS[nextIdx];
            onPlayStateChange?.(true, nextSong ?? null);
            return nextIdx;
          });
          setLoading(true);
          setIsPlaying(true);
        }, delayMs);
      },
      [clearAutoNextTimer, onPlayStateChange]
    );

    // Cleanup timer on unmount
    useEffect(() => {
      return () => clearAutoNextTimer();
    }, [clearAutoNextTimer]);

    // Expose play/pause/next/prev control to parent via ref
    useImperativeHandle(ref, () => ({
      play: () => {
        webViewRef.current?.injectJavaScript(JS_PLAY);
      },
      pause: () => {
        webViewRef.current?.injectJavaScript(JS_PAUSE);
        clearAutoNextTimer();
      },
      togglePlay: () => {
        if (isPlaying) {
          webViewRef.current?.injectJavaScript(JS_PAUSE);
          clearAutoNextTimer();
        } else {
          webViewRef.current?.injectJavaScript(JS_PLAY);
        }
      },
      playNext: () => {
        clearAutoNextTimer();
        setCurrentIndex((prev) => {
          const nextIdx = prev < 0 ? 0 : (prev + 1) % SONGS.length;
          const nextSong = SONGS[nextIdx];
          onPlayStateChange?.(true, nextSong ?? null);
          return nextIdx;
        });
        setLoading(true);
        setIsPlaying(true);
      },
      playPrev: () => {
        clearAutoNextTimer();
        setCurrentIndex((prev) => {
          const prevIdx = prev <= 0 ? SONGS.length - 1 : prev - 1;
          const prevSong = SONGS[prevIdx];
          onPlayStateChange?.(true, prevSong ?? null);
          return prevIdx;
        });
        setLoading(true);
        setIsPlaying(true);
      },
    }));

    // Animation for slide-up / slide-down
    const sheetHeight = Math.min(SCREEN_HEIGHT * 0.88, 700);
    const slideAnim = useRef(new Animated.Value(sheetHeight)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const [hasOpened, setHasOpened] = useState(false);

    useEffect(() => {
      if (visible) {
        setHasOpened(true);
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(backdropAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: sheetHeight,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(backdropAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [visible, sheetHeight, slideAnim, backdropAnim]);

    // Handle messages from WebView
    const handleWebViewMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const data = JSON.parse(event.nativeEvent.data) as WebViewPlayStateMessage;
          if (data.type === "playState") {
            const currentSong = resolveCurrentSong(data, selectedSong);
            setIsPlaying(data.playing);
            onPlayStateChange?.(data.playing, currentSong);
          }
        } catch {
          // ignore parse errors
        }
      },
      [onPlayStateChange, selectedSong]
    );

    const handleClose = useCallback(() => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onClose();
    }, [onClose]);

    const handleSelectSong = useCallback(
      (song: Song) => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        const idx = SONGS.findIndex((s) => s.id === song.id);
        setCurrentIndex(idx >= 0 ? idx : 0);
        setLoading(true);
        setIsPlaying(true);
        onPlayStateChange?.(true, song);
        scheduleAutoNext(song);
      },
      [onPlayStateChange, scheduleAutoNext]
    );

    const handlePlayAll = useCallback(() => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // playlist mode: index -1, netease handles sequence internally
      setCurrentIndex(-1);
      setLoading(true);
      setIsPlaying(true);
      onPlayStateChange?.(true, null);
      // No auto-next timer for playlist mode
      clearAutoNextTimer();
    }, [onPlayStateChange, clearAutoNextTimer]);

    const playerUrl = useMemo(
      () => buildPlayerUrl(selectedSong?.id),
      [selectedSong]
    );

    const filteredSongs = useMemo(() => {
      if (!searchQuery.trim()) return SONGS;
      const q = searchQuery.toLowerCase();
      return SONGS.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q)
      );
    }, [searchQuery]);

    const renderSongItem = useCallback(
      ({ item, index }: { item: Song; index: number }) => {
        const isSelected = currentIndex >= 0 && SONGS[currentIndex]?.id === item.id;
        return (
          <Pressable
            onPress={() => handleSelectSong(item)}
            style={({ pressed }) => [
              styles.songItem,
              isSelected && styles.songItemSelected,
              pressed && styles.songItemPressed,
            ]}
          >
            <Text style={[styles.songIndex, isSelected && styles.songIndexSelected]}>
              {isSelected ? "▶" : String(index + 1)}
            </Text>
            <View style={styles.songInfo}>
              <Text
                style={[styles.songTitle, isSelected && styles.songTitleSelected]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.songMeta} numberOfLines={1}>
                {item.artist}
                {item.album ? ` · ${item.album}` : ""}
              </Text>
            </View>
            <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
          </Pressable>
        );
      },
      [currentIndex, handleSelectSong]
    );

    const keyExtractor = useCallback((item: Song) => String(item.id), []);

    if (!hasOpened) return null;

    return (
      <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }]}>
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim, pointerEvents: visible ? "auto" : "none" }]}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: insets.bottom + 4,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.coverContainer}>
                <Text style={styles.coverEmoji}>🎵</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.playlistName} numberOfLines={1}>
                  {PLAYLIST_NAME}
                </Text>
                <Text style={styles.songCount}>
                  {searchQuery
                    ? `${filteredSongs.length} / ${PLAYLIST_SONG_COUNT} 首`
                    : `共 ${PLAYLIST_SONG_COUNT} 首歌曲`}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="搜索歌曲、歌手、专辑..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== "ios" && (
              <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Play All Button */}
          {!searchQuery && (
            <Pressable
              onPress={handlePlayAll}
              style={({ pressed }) => [
                styles.playAllBtn,
                pressed && styles.playAllBtnPressed,
              ]}
            >
              <Text style={styles.playAllIcon}>▶</Text>
              <Text style={styles.playAllText}>播放全部</Text>
              <Text style={styles.playAllCount}>{PLAYLIST_SONG_COUNT} 首</Text>
            </Pressable>
          )}

          {/* Song List */}
          <FlatList
            data={filteredSongs}
            renderItem={renderSongItem}
            keyExtractor={keyExtractor}
            style={styles.songList}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={30}
            windowSize={10}
            getItemLayout={(_, index) => ({
              length: 52,
              offset: 52 * index,
              index,
            })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>没有找到相关歌曲</Text>
              </View>
            }
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Embedded Player */}
          <View style={styles.playerContainer}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#E60026" />
                <Text style={styles.loadingText}>
                  {selectedSong ? `加载「${selectedSong.title}」...` : "加载播放器..."}
                </Text>
              </View>
            )}
            <WebView
              ref={webViewRef}
              source={{ uri: playerUrl }}
              style={styles.webview}
              onLoadEnd={() => setLoading(false)}
              onLoadStart={() => setLoading(true)}
              onMessage={handleWebViewMessage}
              injectedJavaScript={INJECTED_JS}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            />
          </View>

          {/* Footer hint */}
          <Text style={styles.hint}>🎵 网易云音乐 · 需联网播放</Text>
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#141420",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  coverContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#E60026",
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  playlistName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  songCount: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a3a",
    borderRadius: 15,
  },
  closeBtnText: {
    color: "#AAA",
    fontSize: 13,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#1e1e2e",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: "#EEE",
    fontSize: 13,
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: "#666",
    fontSize: 12,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a3a",
  },
  playAllBtnPressed: {
    backgroundColor: "#1e1e2e",
  },
  playAllIcon: {
    color: "#E60026",
    fontSize: 14,
    fontWeight: "bold",
  },
  playAllText: {
    color: "#EEE",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  playAllCount: {
    color: "#666",
    fontSize: 12,
  },
  songList: {
    flex: 1,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 52,
    gap: 10,
  },
  songItemSelected: {
    backgroundColor: "#1e1e2e",
  },
  songItemPressed: {
    backgroundColor: "#1a1a2a",
  },
  songIndex: {
    color: "#555",
    fontSize: 12,
    width: 22,
    textAlign: "center",
  },
  songIndexSelected: {
    color: "#E60026",
    fontSize: 14,
    fontWeight: "bold",
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: "#DDD",
    fontSize: 14,
    fontWeight: "500",
  },
  songTitleSelected: {
    color: "#E60026",
    fontWeight: "700",
  },
  songMeta: {
    color: "#666",
    fontSize: 11,
    marginTop: 2,
  },
  songDuration: {
    color: "#555",
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#2a2a3a",
  },
  playerContainer: {
    height: 80,
    position: "relative",
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#141420",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  loadingText: {
    color: "#888",
    fontSize: 12,
  },
  hint: {
    textAlign: "center",
    color: "#444",
    fontSize: 10,
    paddingVertical: 4,
    backgroundColor: "#141420",
  },
});
