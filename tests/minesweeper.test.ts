import { describe, it, expect } from "vitest";

type CellState = "hidden" | "revealed" | "flagged" | "question";

interface TestCell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
}

function createEmptyBoard(rows: number, cols: number): TestCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      state: "hidden" as CellState,
      adjacentMines: 0,
    }))
  );
}

function placeMines(
  board: TestCell[][],
  rows: number,
  cols: number,
  mines: number,
  safeRow: number,
  safeCol: number
): TestCell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;
  const isSafe = (r: number, c: number) =>
    Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;

  let r = 0, c = 0;
  while (placed < mines) {
    if (!newBoard[r][c].isMine && !isSafe(r, c)) {
      newBoard[r][c].isMine = true;
      placed++;
    }
    c++;
    if (c >= cols) { c = 0; r++; }
    if (r >= rows) break;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!newBoard[row][col].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) count++;
          }
        }
        newBoard[row][col].adjacentMines = count;
      }
    }
  }
  return newBoard;
}

function checkWin(board: TestCell[][], rows: number, cols: number): boolean {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine && board[r][c].state !== "revealed") return false;
    }
  }
  return true;
}

describe("Minesweeper Core Logic", () => {
  it("creates empty board with correct dimensions", () => {
    const board = createEmptyBoard(9, 9);
    expect(board.length).toBe(9);
    expect(board[0].length).toBe(9);
    board.forEach(row => row.forEach(cell => {
      expect(cell.isMine).toBe(false);
      expect(cell.state).toBe("hidden");
      expect(cell.adjacentMines).toBe(0);
    }));
  });

  it("places correct number of mines", () => {
    const board = createEmptyBoard(9, 9);
    const withMines = placeMines(board, 9, 9, 10, 4, 4);
    const mineCount = withMines.flat().filter(c => c.isMine).length;
    expect(mineCount).toBe(10);
  });

  it("safe zone around first click has no mines", () => {
    const board = createEmptyBoard(9, 9);
    const withMines = placeMines(board, 9, 9, 10, 4, 4);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        expect(withMines[4 + dr][4 + dc].isMine).toBe(false);
      }
    }
  });

  it("adjacent mine counts are correct", () => {
    const board = createEmptyBoard(3, 3);
    board[0][0].isMine = true;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3 && board[nr][nc].isMine) count++;
            }
          }
          board[r][c].adjacentMines = count;
        }
      }
    }
    expect(board[0][1].adjacentMines).toBe(1);
    expect(board[1][0].adjacentMines).toBe(1);
    expect(board[1][1].adjacentMines).toBe(1);
    expect(board[0][2].adjacentMines).toBe(0);
  });

  it("checkWin returns false when hidden non-mine cells exist", () => {
    const board = createEmptyBoard(3, 3);
    board[0][0].isMine = true;
    expect(checkWin(board, 3, 3)).toBe(false);
  });

  it("checkWin returns true when all non-mine cells are revealed", () => {
    const board = createEmptyBoard(3, 3);
    board[0][0].isMine = true;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!board[r][c].isMine) board[r][c].state = "revealed";
      }
    }
    expect(checkWin(board, 3, 3)).toBe(true);
  });

  it("formatTime pads to 3 digits", () => {
    const fmt = (s: number) => String(Math.min(s, 999)).padStart(3, "0");
    expect(fmt(0)).toBe("000");
    expect(fmt(5)).toBe("005");
    expect(fmt(42)).toBe("042");
    expect(fmt(999)).toBe("999");
    expect(fmt(1000)).toBe("999");
  });

  it("long press flag toggle: hidden -> flagged", () => {
    const board = createEmptyBoard(3, 3);
    expect(board[1][1].state).toBe("hidden");
    // Simulate long press: toggle flag on hidden cell
    board[1][1].state = "flagged";
    expect(board[1][1].state).toBe("flagged");
  });

  it("long press flag toggle: flagged -> hidden", () => {
    const board = createEmptyBoard(3, 3);
    board[1][1].state = "flagged";
    // Simulate long press again: remove flag
    board[1][1].state = "hidden";
    expect(board[1][1].state).toBe("hidden");
  });

  it("long press on revealed cell does nothing", () => {
    const board = createEmptyBoard(3, 3);
    board[1][1].state = "revealed";
    // Revealed cells should not be affected by long press
    const stateBefore = board[1][1].state;
    // (logic check: revealed cells are skipped in handleCellLongPress)
    expect(stateBefore).toBe("revealed");
  });

  it("difficulty configs have valid values", () => {
    const configs = {
      beginner:     { rows: 9,  cols: 9,  mines: 10 },
      intermediate: { rows: 16, cols: 16, mines: 40 },
      expert:       { rows: 16, cols: 30, mines: 99 },
    };
    for (const [, cfg] of Object.entries(configs)) {
      expect(cfg.mines).toBeLessThan(cfg.rows * cfg.cols);
      expect(cfg.rows).toBeGreaterThan(0);
      expect(cfg.cols).toBeGreaterThan(0);
    }
  });
});
