import { useState, useCallback, useRef, useEffect } from "react";

export type CellState = "hidden" | "revealed" | "flagged" | "question";
export type GameStatus = "idle" | "playing" | "won" | "lost";
export type Difficulty = "beginner" | "intermediate" | "expert";

export interface Cell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
  isExploded?: boolean;
}

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner:     { rows: 9,  cols: 9,  mines: 10, label: "初级" },
  intermediate: { rows: 16, cols: 16, mines: 40, label: "中级" },
  expert:       { rows: 16, cols: 30, mines: 99, label: "专家" },
};

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      state: "hidden",
      adjacentMines: 0,
    }))
  );
}

function placeMines(board: Cell[][], rows: number, cols: number, mines: number, safeRow: number, safeCol: number): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  let placed = 0;

  // Safe zone: 3x3 around first click
  const isSafe = (r: number, c: number) =>
    Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!newBoard[r][c].isMine && !isSafe(r, c)) {
      newBoard[r][c].isMine = true;
      placed++;
    }
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
              count++;
            }
          }
        }
        newBoard[r][c].adjacentMines = count;
      }
    }
  }

  return newBoard;
}

function floodReveal(board: Cell[][], rows: number, cols: number, startRow: number, startCol: number): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const queue: [number, number][] = [[startRow, startCol]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (newBoard[r][c].state === "flagged") continue;
    newBoard[r][c].state = "revealed";

    if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 && nr < rows &&
            nc >= 0 && nc < cols &&
            !visited.has(`${nr},${nc}`) &&
            newBoard[nr][nc].state === "hidden"
          ) {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  return newBoard;
}

function checkWin(board: Cell[][], rows: number, cols: number): boolean {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isMine && cell.state !== "revealed") return false;
    }
  }
  return true;
}

function revealAllMines(board: Cell[][], rows: number, cols: number, explodedRow: number, explodedCol: number): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) {
        if (r === explodedRow && c === explodedCol) {
          newBoard[r][c].isExploded = true;
        }
        if (newBoard[r][c].state !== "flagged") {
          newBoard[r][c].state = "revealed";
        }
      }
    }
  }
  return newBoard;
}

export function useMinesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(9, 9));
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [flagCount, setFlagCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFlagMode, setIsFlagMode] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstClick = useRef(true);

  const config = DIFFICULTY_CONFIGS[difficulty];

  // Timer management
  useEffect(() => {
    if (gameStatus === "playing") {
      timerRef.current = setInterval(() => {
        setElapsedTime(t => Math.min(t + 1, 999));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  const resetGame = useCallback((newDifficulty?: Difficulty) => {
    const d = newDifficulty ?? difficulty;
    if (newDifficulty) setDifficulty(d);
    const cfg = DIFFICULTY_CONFIGS[d];
    setBoard(createEmptyBoard(cfg.rows, cfg.cols));
    setGameStatus("idle");
    setFlagCount(0);
    setElapsedTime(0);
    setIsFlagMode(false);
    isFirstClick.current = true;
  }, [difficulty]);

  const handleCellPress = useCallback((row: number, col: number) => {
    if (gameStatus === "won" || gameStatus === "lost") return;

    setBoard(prevBoard => {
      const cell = prevBoard[row][col];

      // Flag mode
      if (isFlagMode) {
        if (cell.state === "revealed") return prevBoard;
        const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
        if (cell.state === "hidden") {
          newBoard[row][col].state = "flagged";
          setFlagCount(f => f + 1);
        } else if (cell.state === "flagged") {
          newBoard[row][col].state = "hidden";
          setFlagCount(f => f - 1);
        }
        return newBoard;
      }

      // Dig mode
      if (cell.state === "flagged" || cell.state === "revealed") return prevBoard;

      let currentBoard = prevBoard;

      // First click: place mines
      if (isFirstClick.current) {
        isFirstClick.current = false;
        currentBoard = placeMines(prevBoard, config.rows, config.cols, config.mines, row, col);
        setGameStatus("playing");
      }

      // Hit a mine
      if (currentBoard[row][col].isMine) {
        const revealedBoard = revealAllMines(currentBoard, config.rows, config.cols, row, col);
        setGameStatus("lost");
        return revealedBoard;
      }

      // Reveal cell (flood fill for empty cells)
      const revealedBoard = floodReveal(currentBoard, config.rows, config.cols, row, col);

      // Check win
      if (checkWin(revealedBoard, config.rows, config.cols)) {
        setGameStatus("won");
      }

      return revealedBoard;
    });
  }, [gameStatus, isFlagMode, config]);

  const toggleFlagMode = useCallback(() => {
    setIsFlagMode(f => !f);
  }, []);

  const remainingMines = config.mines - flagCount;

  return {
    board,
    gameStatus,
    difficulty,
    config,
    flagCount,
    remainingMines,
    elapsedTime,
    isFlagMode,
    handleCellPress,
    resetGame,
    toggleFlagMode,
  };
}
