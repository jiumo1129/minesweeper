import React, { memo } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
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
  gameOver: boolean;
}

function MineCellComponent({ cell, size, onPress, gameOver }: MineCellProps) {
  const fontSize = Math.max(size * 0.55, 10);

  const getCellStyle = () => {
    if (cell.state === "revealed") {
      if (cell.isExploded) return [styles.cellBase, styles.cellExploded, { width: size, height: size }];
      if (cell.isMine) return [styles.cellBase, styles.cellRevealedMine, { width: size, height: size }];
      return [styles.cellBase, styles.cellRevealed, { width: size, height: size }];
    }
    if (cell.state === "flagged") return [styles.cellBase, styles.cellHidden, { width: size, height: size }];
    return [styles.cellBase, styles.cellHidden, { width: size, height: size }];
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
          <Text style={[styles.number, { fontSize, color: NUMBER_COLORS[cell.adjacentMines] ?? "#212121" }]}>
            {cell.adjacentMines}
          </Text>
        );
      }
    }
    return null;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={gameOver && cell.state !== "revealed"}
      style={({ pressed }) => [
        ...getCellStyle(),
        pressed && cell.state === "hidden" && styles.cellPressed,
      ]}
    >
      {getCellContent()}
    </Pressable>
  );
}

export const MineCell = memo(MineCellComponent);

const styles = StyleSheet.create({
  cellBase: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
  number: {
    fontWeight: "bold",
    includeFontPadding: false,
  },
  emoji: {
    includeFontPadding: false,
  },
});
