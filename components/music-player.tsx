import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  SONGS,
  PLAYLIST_NAME,
  PLAYLIST_COVER,
  PLAYLIST_SONG_COUNT,
  type Song,
} from "@/constants/playlist";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Format seconds to mm:ss
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Build player URL for a specific song or the full playlist
function buildPlayerUrl(songId?: number): string {
  if (songId) {
    // Single song player
    return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=1&height=66`;
  }
  // Full playlist player
  return `https://music.163.com/outchain/player?type=0&id=2116638139&auto=0&height=66`;
}

interface MusicPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export function MusicPlayer({ visible, onClose }: MusicPlayerProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleClose = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  const handleSelectSong = useCallback((song: Song) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSong(song);
    setLoading(true);
  }, []);

  const handlePlayAll = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedSong(null);
    setLoading(true);
  }, []);

  const playerUrl = useMemo(
    () => buildPlayerUrl(selectedSong?.id),
    [selectedSong]
  );

  // Filter songs by search query
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

  const sheetHeight = Math.min(SCREEN_HEIGHT * 0.88, 700);

  const renderSongItem = useCallback(
    ({ item, index }: { item: Song; index: number }) => {
      const isSelected = selectedSong?.id === item.id;
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
    [selectedSong, handleSelectSong]
  );

  const keyExtractor = useCallback((item: Song) => String(item.id), []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* Bottom Sheet */}
        <View style={[styles.sheet, { height: sheetHeight, paddingBottom: insets.bottom + 4 }]}>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
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

  // Header
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

  // Search
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

  // Play All
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

  // Song List
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
    fontVariant: ["tabular-nums"],
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
    marginHorizontal: 0,
  },

  // Player
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
