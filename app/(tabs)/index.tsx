import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { MineBoard } from "@/components/mine-board";
import { useMinesweeper, DIFFICULTY_CONFIGS, type Difficulty } from "@/hooks/use-minesweeper";
import * as Haptics from "expo-haptics";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "expert"];

function formatTime(seconds: number): string {
  return String(Math.min(seconds, 999)).padStart(3, "0");
}

function formatMines(count: number): string {
  const n = Math.max(-99, Math.min(999, count));
  return n < 0 ? `-${String(Math.abs(n)).padStart(2, "0")}` : String(n).padStart(3, "0");
}

function getFaceEmoji(status: string): string {
  if (status === "won") return "😎";
  if (status === "lost") return "😵";
  return "🙂";
}

export default function GameScreen() {
  const {
    board,
    gameStatus,
    difficulty,
    config,
    remainingMines,
    elapsedTime,
    isFlagMode,
    handleCellPress,
    handleCellLongPress,
    resetGame,
    toggleFlagMode,
  } = useMinesweeper();

  const { width, height } = useWindowDimensions();

  // Calculate cell size to fit the board on screen
  const cellSize = useMemo(() => {
    const horizontalPadding = 16;
    const maxCellByWidth = Math.floor((width - horizontalPadding) / config.cols);
    // Reserve space for header (~90px) + difficulty bar (~44px) + footer (~60px) + hint (~22px) + safe padding
    const reservedHeight = 220;
    const maxCellByHeight = Math.floor((height - reservedHeight) / config.rows);
    const size = Math.min(maxCellByWidth, maxCellByHeight, 36);
    return Math.max(size, 18);
  }, [width, height, config.rows, config.cols]);

  const onCellPress = useCallback(
    (row: number, col: number) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      handleCellPress(row, col);
    },
    [handleCellPress]
  );

  // Long press: toggle flag directly, regardless of current mode
  const onCellLongPress = useCallback(
    (row: number, col: number) => {
      // Haptic is handled inside MineCell for better timing
      handleCellLongPress(row, col);
    },
    [handleCellLongPress]
  );

  const onReset = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetGame();
  }, [resetGame]);

  const onDifficultyChange = useCallback(
    (d: Difficulty) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      resetGame(d);
    },
    [resetGame]
  );

  const onToggleFlagMode = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFlagMode();
  }, [toggleFlagMode]);

  return (
    <ScreenContainer
      containerClassName="bg-[#C0C0C0]"
      safeAreaClassName="bg-[#C0C0C0]"
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.container}>
        {/* Header: Status Panel */}
        <View style={styles.statusPanel}>
          {/* Mine Counter */}
          <View style={styles.ledDisplay}>
            <Text style={styles.ledText}>{formatMines(remainingMines)}</Text>
          </View>

          {/* Face Button */}
          <Pressable
            onPress={onReset}
            style={({ pressed }) => [
              styles.faceButton,
              pressed && styles.faceButtonPressed,
            ]}
          >
            <Text style={styles.faceEmoji}>{getFaceEmoji(gameStatus)}</Text>
          </Pressable>

          {/* Timer */}
          <View style={styles.ledDisplay}>
            <Text style={styles.ledText}>{formatTime(elapsedTime)}</Text>
          </View>
        </View>

        {/* Difficulty Selector */}
        <View style={styles.difficultyBar}>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d}
              onPress={() => onDifficultyChange(d)}
              style={({ pressed }) => [
                styles.difficultyBtn,
                difficulty === d && styles.difficultyBtnActive,
                pressed && styles.difficultyBtnPressed,
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  difficulty === d && styles.difficultyTextActive,
                ]}
              >
                {DIFFICULTY_CONFIGS[d].label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Game Board */}
        <View style={styles.boardWrapper}>
          <MineBoard
            board={board}
            cellSize={cellSize}
            gameStatus={gameStatus}
            onCellPress={onCellPress}
            onCellLongPress={onCellLongPress}
          />
        </View>

        {/* Footer: Flag Mode Toggle + Long Press Hint */}
        <View style={styles.footer}>
          <Pressable
            onPress={onToggleFlagMode}
            style={({ pressed }) => [
              styles.modeButton,
              !isFlagMode && styles.modeButtonActive,
              pressed && styles.modeButtonPressed,
            ]}
          >
            <Text style={styles.modeEmoji}>⛏️</Text>
            <Text style={[styles.modeLabel, !isFlagMode && styles.modeLabelActive]}>
              挖掘
            </Text>
          </Pressable>

          <Pressable
            onPress={onToggleFlagMode}
            style={({ pressed }) => [
              styles.modeButton,
              isFlagMode && styles.modeButtonActive,
              pressed && styles.modeButtonPressed,
            ]}
          >
            <Text style={styles.modeEmoji}>🚩</Text>
            <Text style={[styles.modeLabel, isFlagMode && styles.modeLabelActive]}>
              插旗
            </Text>
          </Pressable>
        </View>

        {/* Long press hint */}
        <Text style={styles.hint}>长按格子可快速插旗 / 取消旗帜</Text>

        {/* Game Result Overlay */}
        {(gameStatus === "won" || gameStatus === "lost") && (
          <View style={styles.resultOverlay} pointerEvents="none">
            <View style={styles.resultBox}>
              <Text style={styles.resultEmoji}>
                {gameStatus === "won" ? "🎉" : "💥"}
              </Text>
              <Text style={styles.resultText}>
                {gameStatus === "won" ? "胜利！" : "踩雷了！"}
              </Text>
              {gameStatus === "won" && (
                <Text style={styles.resultSub}>用时 {elapsedTime} 秒</Text>
              )}
              <Text style={styles.resultRestart}>点击 🙂 重新开始</Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C0C0C0",
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 4,
  },

  // Status Panel (classic Windows Minesweeper style)
  statusPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#C0C0C0",
    borderWidth: 3,
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  ledDisplay: {
    backgroundColor: "#000000",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
    minWidth: 52,
    alignItems: "center",
  },
  ledText: {
    color: "#FF0000",
    fontSize: 22,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  faceButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C0C0C0",
    borderWidth: 3,
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
  },
  faceButtonPressed: {
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
  },
  faceEmoji: {
    fontSize: 22,
  },

  // Difficulty Bar
  difficultyBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 6,
  },
  difficultyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#C0C0C0",
    borderWidth: 2,
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
  },
  difficultyBtnActive: {
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
    backgroundColor: "#B0B0B0",
  },
  difficultyBtnPressed: {
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  difficultyTextActive: {
    color: "#000000",
  },

  // Board
  boardWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#C0C0C0",
    borderWidth: 2,
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
  },
  modeButtonActive: {
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
    backgroundColor: "#B0B0B0",
  },
  modeButtonPressed: {
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
  },
  modeEmoji: {
    fontSize: 18,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555555",
  },
  modeLabelActive: {
    color: "#000000",
  },

  // Long press hint
  hint: {
    textAlign: "center",
    fontSize: 11,
    color: "#666666",
    paddingBottom: 2,
  },

  // Result Overlay
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  resultBox: {
    backgroundColor: "#C0C0C0",
    borderWidth: 3,
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
  },
  resultEmoji: {
    fontSize: 40,
  },
  resultText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  resultSub: {
    fontSize: 14,
    color: "#555555",
    marginTop: 2,
  },
  resultRestart: {
    fontSize: 12,
    color: "#777777",
    marginTop: 4,
  },
});
