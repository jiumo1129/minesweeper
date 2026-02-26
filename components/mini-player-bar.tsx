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
  onPlayNext?: () => void;
  onPlayPrev?: () => void;
}

export function MiniPlayerBar({
  visible,
  isPlaying,
  currentSong,
  onTogglePlay,
  onOpenPlayer,
  onPlayNext,
  onPlayPrev,
}: MiniPlayerBarProps) {
  const slideAnim = useRef(new Animated.Value(70)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 70,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const haptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const songTitle = currentSong?.title ?? "等墨久喜欢的音乐";
  const songArtist = currentSong?.artist ?? "点击选歌";

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Top progress indicator line */}
      <View style={styles.progressLine}>
        <View style={[styles.progressFill, isPlaying && styles.progressFillPlaying]} />
      </View>

      <View style={styles.row}>
        {/* Tap left area to open full player */}
        <Pressable
          onPress={() => { haptic(); onOpenPlayer(); }}
          style={({ pressed }) => [styles.infoArea, pressed && styles.pressed]}
        >
          <View style={[styles.iconBox, isPlaying && styles.iconBoxPlaying]}>
            <Text style={styles.iconText}>🎵</Text>
          </View>
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>{songTitle}</Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {isPlaying ? `▶ ${songArtist}` : songArtist}
            </Text>
          </View>
        </Pressable>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Prev */}
          <Pressable
            onPress={() => { haptic(); onPlayPrev?.(); }}
            style={({ pressed }) => [styles.ctrlBtn, pressed && styles.ctrlBtnPressed]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={styles.ctrlIcon}>⏮</Text>
          </Pressable>

          {/* Play / Pause */}
          <Pressable
            onPress={() => { haptic(); onTogglePlay(); }}
            style={({ pressed }) => [styles.playBtn, pressed && styles.playBtnPressed]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={styles.playBtnText}>{isPlaying ? "⏸" : "▶"}</Text>
          </Pressable>

          {/* Next */}
          <Pressable
            onPress={() => { haptic(); onPlayNext?.(); }}
            style={({ pressed }) => [styles.ctrlBtn, pressed && styles.ctrlBtnPressed]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={styles.ctrlIcon}>⏭</Text>
          </Pressable>
        </View>
      </View>
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
    width: "40%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    minHeight: 54,
  },
  infoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
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
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctrlBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  ctrlBtnPressed: {
    backgroundColor: "#2a2a3a",
  },
  ctrlIcon: {
    color: "#CCC",
    fontSize: 16,
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
});
