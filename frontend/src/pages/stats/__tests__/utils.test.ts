/**
 * pages/stats/utils.ts のユニットテスト
 */
import { describe, it, expect } from "vitest";
import { Temporal } from "temporal-polyfill";
import {
  calculateCompletedBooks,
  findLongestSession,
  calculateRecentActivity,
  calculateAverageReadingSpeed,
  calculateConsistencyScore,
  generateMonthlyTrend,
  calculateTimeSlotDistribution,
} from "../utils";

// ============================================================
// ヘルパー
// ============================================================

const dt = (s: string) => Temporal.PlainDateTime.from(s);

const mkLog = (
  isbn: number,
  page: [number, number],
  sec: number,
  created: string,
) => ({
  readingLog: {
    id: `log-${isbn}`,
    isbn,
    page,
    sessionDurationSec: sec,
    rating: 5,
    createdAt: dt(created),
  } as ReadingLog,
  laps: [] as Lap[],
});

const mkBook = (isbn: number, pageCount: number): Book => ({
  isbn,
  title: "Test",
  authors: ["Author"],
  imageUrl: "",
  pageCount,
  publisher: "Pub",
  createdAt: dt("2025-01-01T00:00"),
});

// ============================================================
// calculateCompletedBooks
// ============================================================

describe("calculateCompletedBooks", () => {
  it("空配列は0を返す", () => {
    expect(calculateCompletedBooks([], [])).toBe(0);
  });

  it("完読した本をカウントする", () => {
    const books = [mkBook(1, 100)];
    const logs = [mkLog(1, [1, 100], 600, "2025-06-01T10:00")];
    expect(calculateCompletedBooks(books, logs)).toBe(1);
  });

  it("途中の本はカウントしない", () => {
    const books = [mkBook(1, 100)];
    const logs = [mkLog(1, [1, 50], 600, "2025-06-01T10:00")];
    expect(calculateCompletedBooks(books, logs)).toBe(0);
  });

  it("複数冊の混合", () => {
    const books = [mkBook(1, 100), mkBook(2, 200)];
    const logs = [
      mkLog(1, [1, 100], 600, "2025-06-01T10:00"),
      mkLog(2, [1, 50], 600, "2025-06-02T10:00"),
    ];
    expect(calculateCompletedBooks(books, logs)).toBe(1);
  });
});

// ============================================================
// findLongestSession
// ============================================================

describe("findLongestSession", () => {
  it("空配列は0を返す", () => {
    expect(findLongestSession([])).toBe(0);
  });

  it("最長セッションの秒数を返す", () => {
    const logs = [
      mkLog(1, [1, 10], 600, "2025-06-01T10:00"),
      mkLog(1, [10, 20], 1800, "2025-06-02T10:00"),
      mkLog(1, [20, 30], 900, "2025-06-03T10:00"),
    ];
    expect(findLongestSession(logs)).toBe(1800);
  });
});

// ============================================================
// calculateRecentActivity
// ============================================================

describe("calculateRecentActivity", () => {
  it("空配列は0を返す", () => {
    expect(calculateRecentActivity([], 7)).toBe(0);
  });

  // Note: この関数は Temporal.Now を内部で使うため、
  // 時間依存のテストは安定しない場合がある。
  // 将来的に「today」引数を追加するリファクタリングが望ましい。
});

// ============================================================
// calculateAverageReadingSpeed
// ============================================================

describe("calculateAverageReadingSpeed", () => {
  it("0ページは0を返す", () => {
    expect(calculateAverageReadingSpeed(0, 3600)).toBe(0);
  });

  it("正しい分/ページを返す", () => {
    // 10ページ, 600秒(10分) → 1.0 分/ページ
    expect(calculateAverageReadingSpeed(10, 600)).toBe(1);
  });
});

// ============================================================
// calculateConsistencyScore
// ============================================================

describe("calculateConsistencyScore", () => {
  it("空配列は0を返す", () => {
    expect(calculateConsistencyScore([])).toBe(0);
  });

  // Note: Temporal.Now 依存のため、安定したテストには
  // today 引数の追加が必要
});

// ============================================================
// generateMonthlyTrend
// ============================================================

describe("generateMonthlyTrend", () => {
  it("空配列は空配列を返す", () => {
    expect(generateMonthlyTrend([])).toEqual([]);
  });

  it("月別にセッション数・時間・ページを集計する", () => {
    const logs = [
      mkLog(1, [1, 30], 600, "2025-06-01T10:00"),
      mkLog(1, [30, 50], 1200, "2025-06-15T10:00"),
      mkLog(1, [50, 80], 900, "2025-07-01T10:00"),
    ];
    const result = generateMonthlyTrend(logs);
    expect(result.length).toBeGreaterThanOrEqual(2);

    const jun = result.find((d) => d.month.includes("6"));
    expect(jun?.sessions).toBe(2);
    expect(jun?.time).toBe(1800);
    expect(jun?.pages).toBe(49); // (30-1) + (50-30)
  });
});

// ============================================================
// calculateTimeSlotDistribution
// ============================================================

describe("calculateTimeSlotDistribution", () => {
  it("空配列は空配列を返す", () => {
    expect(calculateTimeSlotDistribution([])).toEqual([]);
  });

  it("時間帯別に分類する", () => {
    const logs = [
      mkLog(1, [1, 10], 600, "2025-06-01T08:00"), // 朝
      mkLog(1, [10, 20], 600, "2025-06-01T13:00"), // 昼
      mkLog(1, [20, 30], 600, "2025-06-01T18:00"), // 夕方
      mkLog(1, [30, 40], 600, "2025-06-01T22:00"), // 夜
    ];
    const result = calculateTimeSlotDistribution(logs);
    expect(result).toHaveLength(4);

    const morning = result.find((d) => d.slot === "朝");
    expect(morning?.count).toBe(1);
    expect(morning?.percentage).toBe(25);
  });

  it("深夜は '夜' に分類する", () => {
    const logs = [mkLog(1, [1, 10], 600, "2025-06-01T02:00")]; // 夜
    const result = calculateTimeSlotDistribution(logs);
    const night = result.find((d) => d.slot === "夜");
    expect(night?.count).toBe(1);
  });
});

