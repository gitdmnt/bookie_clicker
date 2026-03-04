/**
 * テスト用ヘルパー関数群
 *
 * テストファイル間で共通して使用するモックやファクトリ関数を提供する。
 */
import { vi } from "vitest";
import { Temporal } from "temporal-polyfill";

// ============================================================
// ファクトリ関数
// ============================================================

export const createBook = (
  isbn: number,
  overrides: Partial<Book> = {},
): Book => ({
  isbn,
  title: `Test Book ${isbn}`,
  authors: ["Test Author"],
  imageUrl: `https://example.com/${isbn}.jpg`,
  pageCount: 300,
  publisher: "Test Publisher",
  year: 2025,
  createdAt: Temporal.PlainDateTime.from("2025-01-01T00:00"),
  ...overrides,
});

export const createReadingLog = (
  isbn: number,
  overrides: Partial<ReadingLog> = {},
): ReadingLog => ({
  id: `log-${isbn}-${Date.now()}`,
  isbn,
  createdAt: Temporal.PlainDateTime.from("2025-06-01T10:00"),
  sessionDurationSec: 600,
  page: [1, 50] as [number, number],
  rating: 5,
  ...overrides,
});

export const createLap = (overrides: Partial<Lap> = {}): Lap => ({
  elapsedMs: 30000,
  note: "テストメモ",
  refPage: 10,
  ...overrides,
});

export const createReadingLogWithLaps = (
  isbn: number,
  page: [number, number],
  sec: number,
  created: string,
  laps: Lap[] = [],
) => ({
  readingLog: createReadingLog(isbn, {
    page,
    sessionDurationSec: sec,
    createdAt: Temporal.PlainDateTime.from(created),
  }),
  laps,
});

// ============================================================
// API モック
// ============================================================

/** すべてのAPI関数をvi.fn()で置き換えるモック */
export const createApiMock = () => ({
  searchBooksByISBN: vi.fn().mockResolvedValue([]),
  scanBarcodeISBN: vi.fn().mockRejectedValue(new Error("Not implemented")),
  addBook: vi.fn().mockResolvedValue(undefined),
  addReadingLog: vi.fn().mockResolvedValue(undefined),
  addLaps: vi.fn().mockResolvedValue(undefined),
  selectBooks: vi.fn().mockResolvedValue([]),
  selectReadingLogs: vi.fn().mockResolvedValue([]),
  selectLaps: vi.fn().mockResolvedValue([]),
  deleteBooks: vi.fn().mockResolvedValue(undefined),
  deleteReadingLogs: vi.fn().mockResolvedValue(undefined),
  deleteLap: vi.fn().mockResolvedValue(undefined),
  exportDatabase: vi.fn().mockResolvedValue(""),
  startTimer: vi.fn().mockResolvedValue(undefined),
  stopTimer: vi.fn().mockResolvedValue(undefined),
  resetTimer: vi.fn().mockResolvedValue(undefined),
  getTimer: vi
    .fn()
    .mockResolvedValue({ elapsed: 0, h: 0, m: 0, s: 0, isRunning: false }),
  getTimerLaps: vi.fn().mockResolvedValue([]),
  timerLap: vi.fn().mockResolvedValue({ elapsedMs: 0, note: "", refPage: 0 }),
  onTimerTick: vi.fn().mockResolvedValue(async () => {}),
  saveTimerSession: vi.fn().mockResolvedValue({
    readingLogId: "mock-log-id",
    sessionDurationSec: 0,
  }),
  fetchWikipediaData: vi.fn().mockResolvedValue([]),
});

