import React, { memo, useCallback } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { MineCell } from "./mine-cell";
import type { Cell, GameStatus } from "@/hooks/use-minesweeper";

interface MineBoardProps {
  board: Cell[][];
  cellSize: number;
  gameStatus: GameStatus;
  onCellPress: (row: number, col: number) => void;
}

function MineBoardComponent({ board, cellSize, gameStatus, onCellPress }: MineBoardProps) {
  const gameOver = gameStatus === "won" || gameStatus === "lost";

  const renderRow = useCallback(
    (row: Cell[], rowIndex: number) => (
      <View key={rowIndex} style={styles.row}>
        {row.map((cell, colIndex) => (
          <MineCell
            key={colIndex}
            cell={cell}
            size={cellSize}
            gameOver={gameOver}
            onPress={() => onCellPress(rowIndex, colIndex)}
          />
        ))}
      </View>
    ),
    [cellSize, gameOver, onCellPress]
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalContent}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.verticalContent}
      >
        <View style={styles.boardContainer}>
          {board.map((row, rowIndex) => renderRow(row, rowIndex))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

export const MineBoard = memo(MineBoardComponent);

const styles = StyleSheet.create({
  horizontalContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  verticalContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  boardContainer: {
    borderWidth: 3,
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
  },
});
