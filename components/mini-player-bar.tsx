import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { Song } from "@/constants/playlist";

interface MiniPlayerBarProps {
  visible: boolean;
  isPlaying: boolean;
  currentSong: Song | null;
  onTogglePlay: () => void;
  onOpenPlayer: () => void;
}

export function MiniPlayerBar({
  visible,
  isPlaying,
  currentSong,
  onTogglePlay,
  onOpenPlayer,
}: MiniPlayerBarProps) {
  const slideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 60,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const handleTogglePlay = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTogglePlay();
  };

  const handleOpen = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onOpenPlayer();
  };

  const songTitle = currentSong?.title ?? "等墨久喜欢的音乐";
  const songArtist = currentSong?.artist ?? "播放全部";

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Progress indicator line */}
      <View style={styles.progressLine}>
        <Animated.View
          style={[
            styles.progressFill,
            isPlaying && styles.progressFillPlaying,
          ]}
        />
      </View>

      {/* Main content: tap to open player */}
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.content,
          pressed && styles.contentPressed,
        ]}
      >
        {/* Music note icon */}
        <View style={[styles.iconBox, isPlaying && styles.iconBoxPlaying]}>
          <Text style={styles.iconText}>🎵</Text>
        </View>

        {/* Song info */}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {songTitle}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {isPlaying ? `▶ ${songArtist}` : songArtist}
          </Text>
        </View>

        {/* Play/Pause button */}
        <Pressable
          onPress={handleTogglePlay}
          style={({ pressed }) => [
            styles.playBtn,
            pressed && styles.playBtnPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.playBtnText}>{isPlaying ? "⏸" : "▶"}</Text>
        </Pressable>

        {/* Open arrow */}
        <View style={styles.arrowBox}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a28",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  progressLine: {
    height: 2,
    backgroundColor: "#2a2a3a",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "0%",
    backgroundColor: "#E60026",
  },
  progressFillPlaying: {
    width: "40%", // Static visual indicator; real progress requires deeper WebView integration
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
    minHeight: 52,
  },
  contentPressed: {
    backgroundColor: "#22223a",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#2a2a3a",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxPlaying: {
    backgroundColor: "#E60026",
  },
  iconText: {
    fontSize: 18,
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    color: "#EEE",
    fontSize: 13,
    fontWeight: "600",
  },
  songArtist: {
    color: "#888",
    fontSize: 11,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E60026",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnPressed: {
    backgroundColor: "#c00020",
  },
  playBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 2,
  },
  arrowBox: {
    width: 20,
    alignItems: "center",
  },
  arrowText: {
    color: "#555",
    fontSize: 20,
    fontWeight: "300",
  },
});
