import React, { memo, useRef } from "react";
import { Pressable, Text, StyleSheet, Animated, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import type { Cell } from "@/hooks/use-minesweeper";

const NUMBER_COLORS: Record<number, string> = {
  1: "#1565C0",
  2: "#2E7D32",
  3: "#C62828",
  4: "#1A237E",
  5: "#B71C1C",
  6: "#006064",
  7: "#212121",
  8: "#757575",
};

interface MineCellProps {
  cell: Cell;
  size: number;
  onPress: () => void;
  onLongPress: () => void;
  gameOver: boolean;
}

function MineCellComponent({ cell, size, onPress, onLongPress, gameOver }: MineCellProps) {
  const fontSize = Math.max(size * 0.55, 10);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLongPress = () => {
    // Trigger haptic feedback on long press
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Brief scale-down animation to signal long press registered
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onLongPress();
  };

  const getCellBorderStyle = () => {
    if (cell.state === "revealed") {
      return cell.isExploded
        ? styles.cellExploded
        : cell.isMine
        ? styles.cellRevealedMine
        : styles.cellRevealed;
    }
    return styles.cellHidden;
  };

  const getCellContent = () => {
    if (cell.state === "flagged") {
      return <Text style={[styles.emoji, { fontSize: fontSize * 0.9 }]}>🚩</Text>;
    }
    if (cell.state === "revealed") {
      if (cell.isMine) {
        return <Text style={[styles.emoji, { fontSize: fontSize * 0.9 }]}>💣</Text>;
      }
      if (cell.adjacentMines > 0) {
        return (
          <Text
            style={[
              styles.number,
              { fontSize, color: NUMBER_COLORS[cell.adjacentMines] ?? "#212121" },
            ]}
          >
            {cell.adjacentMines}
          </Text>
        );
      }
    }
    return null;
  };

  const isInteractable = !gameOver || cell.state === "revealed";

  return (
    <Pressable
      onPress={isInteractable ? onPress : undefined}
      onLongPress={
        // Long press only works on hidden/flagged cells (not revealed, not game over)
        !gameOver && cell.state !== "revealed" ? handleLongPress : undefined
      }
      delayLongPress={350}
      style={({ pressed }) => [
        styles.cellBase,
        getCellBorderStyle(),
        { width: size, height: size },
        pressed && cell.state === "hidden" && styles.cellPressed,
      ]}
    >
      <Animated.View
        style={[
          styles.innerContent,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {getCellContent()}
      </Animated.View>
    </Pressable>
  );
}

export const MineCell = memo(MineCellComponent);

const styles = StyleSheet.create({
  cellBase: {
    alignItems: "center",
    justifyContent: "center",
  },
  cellHidden: {
    backgroundColor: "#C0C0C0",
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
    borderWidth: 2,
  },
  cellPressed: {
    backgroundColor: "#A8A8A8",
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
  },
  cellRevealed: {
    backgroundColor: "#BEBEBE",
    borderColor: "#808080",
    borderWidth: 1,
  },
  cellRevealedMine: {
    backgroundColor: "#BEBEBE",
    borderColor: "#808080",
    borderWidth: 1,
  },
  cellExploded: {
    backgroundColor: "#FF0000",
    borderColor: "#808080",
    borderWidth: 1,
  },
  innerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontWeight: "bold",
    includeFontPadding: false,
  },
  emoji: {
    includeFontPadding: false,
  },
});
