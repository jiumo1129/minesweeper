import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Local elapsed time tracker for progress bar
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const songDuration = currentSong?.duration ?? 0;

  // Reset progress when song changes
  useEffect(() => {
    setElapsed(0);
    progressAnim.setValue(0);
  }, [currentSong?.id, progressAnim]);

  // Start/stop the elapsed timer based on isPlaying
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isPlaying && songDuration > 0) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= songDuration) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            return songDuration;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, songDuration]);

  // Animate progress bar width based on elapsed / duration
  useEffect(() => {
    if (songDuration <= 0) return;
    const ratio = Math.min(elapsed / songDuration, 1);
    Animated.timing(progressAnim, {
      toValue: ratio,
      duration: 800,
      useNativeDriver: false, // width animation requires non-native driver
    }).start();
  }, [elapsed, songDuration, progressAnim]);

  // Slide in/out animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 70,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const haptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const songTitle = currentSong?.title ?? "等墨久喜欢的音乐";
  const songArtist = currentSong?.artist ?? "点击选歌";

  // Format mm:ss
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <View style={styles.row}>
        {/* Left: tap to open full player */}
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
          {/* Time display */}
          {songDuration > 0 && (
            <Text style={styles.timeText}>
              {fmt(elapsed)}/{fmt(songDuration)}
            </Text>
          )}
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
  progressTrack: {
    height: 2,
    backgroundColor: "#2a2a3a",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E60026",
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
  timeText: {
    color: "#666",
    fontSize: 10,
    minWidth: 72,
    textAlign: "right",
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
