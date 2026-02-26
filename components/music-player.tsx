import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const PLAYLIST_ID = "2116638139";
const PLAYER_URL = `https://music.163.com/outchain/player?type=0&id=${PLAYLIST_ID}&auto=0&height=430`;

const SONGS = [
  { title: "相思遥", artist: "张含韵" },
  { title: "山阴路的夏天", artist: "秋大清" },
  { title: "Rain after Summer", artist: "羽肿" },
  { title: "雪の進軍", artist: "あんこうチーム" },
  { title: "不就是一起长大", artist: "Max马俊/Maxson马颢睿" },
  { title: "小酒歌", artist: "郝云/梁龙/臧鸿飞" },
];

const COVER_URL =
  "https://p1.music.126.net/XV0em4r9JLkC-0utEVNDaw==/109951170591164326.jpg?param=90y90";

interface MusicPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export function MusicPlayer({ visible, onClose }: MusicPlayerProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleClose = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  const { height: screenHeight } = Dimensions.get("window");
  const sheetHeight = Math.min(screenHeight * 0.78, 600);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to close */}
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* Bottom Sheet */}
        <View
          style={[
            styles.sheet,
            { height: sheetHeight, paddingBottom: insets.bottom + 8 },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* Cover thumbnail */}
              <WebView
                source={{ uri: COVER_URL }}
                style={styles.coverThumb}
                scrollEnabled={false}
                pointerEvents="none"
              />
              <View style={styles.headerInfo}>
                <Text style={styles.playlistName} numberOfLines={1}>
                  等墨久喜欢的音乐
                </Text>
                <Text style={styles.songCount}>{SONGS.length} 首歌曲</Text>
              </View>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Song list preview */}
          <View style={styles.songList}>
            {SONGS.map((song, i) => (
              <View key={i} style={styles.songItem}>
                <Text style={styles.songIndex}>{i + 1}</Text>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artist}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Embedded Player */}
          <View style={styles.playerContainer}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#E60026" />
                <Text style={styles.loadingText}>加载播放器中...</Text>
              </View>
            )}
            <WebView
              ref={webViewRef}
              source={{ uri: PLAYER_URL }}
              style={styles.webview}
              onLoadEnd={() => setLoading(false)}
              onLoadStart={() => setLoading(true)}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState={false}
              // Allow mixed content for music streaming
              mixedContentMode="always"
              // User agent to avoid mobile redirect
              userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            />
          </View>

          {/* Open in NetEase hint */}
          <Text style={styles.hint}>
            🎵 由网易云音乐提供 · 需联网播放
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    paddingHorizontal: 0,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#555",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
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
  coverThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#333",
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
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    borderRadius: 16,
  },
  closeBtnText: {
    color: "#CCC",
    fontSize: 14,
    fontWeight: "600",
  },

  // Song list
  songList: {
    paddingHorizontal: 16,
    gap: 4,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 10,
  },
  songIndex: {
    color: "#666",
    fontSize: 12,
    width: 18,
    textAlign: "center",
  },
  songInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  songTitle: {
    color: "#EEE",
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 1,
  },
  songArtist: {
    color: "#888",
    fontSize: 11,
    flexShrink: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
    marginHorizontal: 16,
    marginVertical: 8,
  },

  // Player
  playerContainer: {
    flex: 1,
    marginHorizontal: 0,
    position: "relative",
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    color: "#999",
    fontSize: 14,
  },

  hint: {
    textAlign: "center",
    color: "#555",
    fontSize: 11,
    paddingVertical: 6,
    backgroundColor: "#1a1a2e",
  },
});
