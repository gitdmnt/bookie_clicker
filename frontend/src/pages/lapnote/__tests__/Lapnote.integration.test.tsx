/**
 * Lapnote ページの結合テスト
 *
 * タイマー操作・ラップノート記録の基本フローをテストする。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createBook } from "@/__tests__/helpers";

const {
  mockGetTimer,
  mockGetTimerLaps,
  mockOnTimerTick,
  mockStartTimer,
  mockPauseTimer,
  mockResetTimer,
  mockInsertLap,
  mockDeleteLap,
  mockInsertReadingLog,
  mockSelectReadingLogs,
  mockSelectLaps,
  mockSelectBooks,
} = vi.hoisted(() => ({
  mockGetTimer: vi.fn(),
  mockGetTimerLaps: vi.fn(),
  mockOnTimerTick: vi.fn(),
  mockStartTimer: vi.fn(),
  mockPauseTimer: vi.fn(),
  mockResetTimer: vi.fn(),
  mockInsertLap: vi.fn(),
  mockDeleteLap: vi.fn(),
  mockInsertReadingLog: vi.fn(),
  mockSelectReadingLogs: vi.fn().mockResolvedValue([]),
  mockSelectLaps: vi.fn().mockResolvedValue([]),
  mockSelectBooks: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/utils/api", () => ({
  getTimer: mockGetTimer,
  getTimerLaps: mockGetTimerLaps,
  onTimerTick: mockOnTimerTick,
  startTimer: mockStartTimer,
  pauseTimer: mockPauseTimer,
  resetTimer: mockResetTimer,
  insertLap: mockInsertLap,
  deleteLap: mockDeleteLap,
  insertReadingLog: mockInsertReadingLog,
  selectReadingLogs: mockSelectReadingLogs,
  selectLaps: mockSelectLaps,
  selectBooks: mockSelectBooks,
}));

vi.mock("@/utils/env-detect", () => ({
  isTauri: () => false,
}));

import { Lapnote } from "@/pages/lapnote";

describe("Lapnote 結合テスト", () => {
  const book = createBook(9784001234567, {
    title: "テスト本",
    pageCount: 300,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTimer.mockResolvedValue({
      elapsed: 0,
      h: 0,
      m: 0,
      s: 0,
      isRunning: false,
    });
    mockGetTimerLaps.mockResolvedValue([]);
    mockOnTimerTick.mockResolvedValue(async () => {});
  });

  it("本が選択されていない場合、選択を促すメッセージを表示する", () => {
    render(<Lapnote book={null} />);
    expect(screen.getByText(/本棚から本を選んで/)).toBeTruthy();
  });

  it("本が選択されている場合、タイマーが表示される", async () => {
    render(<Lapnote book={book} />);

    // onTimerTick が登録されることを確認
    expect(mockOnTimerTick).toHaveBeenCalled();
  });
});

