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
import { PinchZoomBoard } from "@/components/pinch-zoom-board";
import { useMinesweeper, DIFFICULTY_CONFIGS, type Difficulty } from "@/hooks/use-minesweeper";
import * as Haptics from "expo-haptics";
import { useMusicContext } from "@/lib/music-context";

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

  // Music context — controls the global floating music player
  const { showMiniBar, openMusic } = useMusicContext();

  const MINI_BAR_HEIGHT = 54;

  const cellSize = useMemo(() => {
    const horizontalPadding = 16;
    const maxCellByWidth = Math.floor((width - horizontalPadding) / config.cols);
    const reservedHeight = 220 + (showMiniBar ? MINI_BAR_HEIGHT : 0);
    const maxCellByHeight = Math.floor((height - reservedHeight) / config.rows);
    const size = Math.min(maxCellByWidth, maxCellByHeight, 36);
    return Math.max(size, 18);
  }, [width, height, config.rows, config.cols, showMiniBar]);

  const onCellPress = useCallback(
    (row: number, col: number) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      handleCellPress(row, col);
    },
    [handleCellPress]
  );

  const onCellLongPress = useCallback(
    (row: number, col: number) => {
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
          <View style={styles.ledDisplay}>
            <Text style={styles.ledText}>{formatMines(remainingMines)}</Text>
          </View>

          <Pressable
            onPress={onReset}
            style={({ pressed }) => [
              styles.faceButton,
              pressed && styles.faceButtonPressed,
            ]}
          >
            <Text style={styles.faceEmoji}>{getFaceEmoji(gameStatus)}</Text>
          </Pressable>

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
          <PinchZoomBoard>
            <MineBoard
              board={board}
              cellSize={cellSize}
              gameStatus={gameStatus}
              onCellPress={onCellPress}
              onCellLongPress={onCellLongPress}
            />
          </PinchZoomBoard>
        </View>

        {/* Footer: Flag Mode Toggle */}
        <View style={[styles.footer, showMiniBar && styles.footerWithMiniBar]}>
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
        <Text style={styles.hint}>长按插旗 · 双指缩放 · 双击还原</Text>


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

const MINI_BAR_HEIGHT = 54;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C0C0C0",
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 4,
  },

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
    backgroundColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 2,
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
    width: 36,
    height: 36,
    backgroundColor: "#C0C0C0",
    borderWidth: 3,
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
    alignItems: "center",
    justifyContent: "center",
  },
  faceButtonPressed: {
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
  },
  faceEmoji: {
    fontSize: 20,
  },

  difficultyBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 6,
  },
  difficultyBtn: {
    flex: 1,
    paddingVertical: 5,
    backgroundColor: "#C0C0C0",
    borderWidth: 2,
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
    alignItems: "center",
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
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  difficultyTextActive: {
    color: "#000080",
  },

  boardWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderTopColor: "#808080",
    borderLeftColor: "#808080",
    borderBottomColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
    backgroundColor: "#C0C0C0",
    marginBottom: 6,
  },

  footer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  footerWithMiniBar: {
    marginBottom: MINI_BAR_HEIGHT + 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
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
    fontSize: 16,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
  },
  modeLabelActive: {
    color: "#000080",
    fontWeight: "700",
  },

  hint: {
    textAlign: "center",
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },


  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  resultBox: {
    backgroundColor: "#C0C0C0",
    borderWidth: 3,
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomColor: "#808080",
    borderRightColor: "#808080",
    padding: 24,
    alignItems: "center",
    gap: 6,
    minWidth: 160,
  },
  resultEmoji: {
    fontSize: 40,
  },
  resultText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  resultSub: {
    fontSize: 14,
    color: "#444",
  },
  resultRestart: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
