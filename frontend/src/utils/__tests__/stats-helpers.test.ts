/**
 * stats-helpers.ts の純粋関数ユニットテスト
 */
import { describe, it, expect } from "vitest";
import { Temporal } from "temporal-polyfill";
import {
  calculateTotalReadingTimeSec,
  calculateTotalPages,
  calculateTotalMemos,
  formatSecondsToHM,
  calculateStreak,
  calculateAverageReadingSpeed,
  calculateBookStats,
  getTopBooksByReadingTime,
  computeFirstPage,
  computeLastPage,
  stopwatchTimeToSeconds,
  secondsToStopwatchTime,
  filterBooks,
  calculateLogbookStatistics,
  generateTopSessions,
  type ReadingLogWithLaps,
} from "@/utils/stats-helpers";

// ============================================================
// テストヘルパー
// ============================================================

const dt = (s: string) => Temporal.PlainDateTime.from(s);

const mkLog = (
  isbn: number,
  page: [number, number],
  sec: number,
  created: string,
  laps: Lap[] = [],
): ReadingLogWithLaps => ({
  readingLog: {
    id: `log-${isbn}-${page[0]}`,
    isbn,
    page,
    sessionDurationSec: sec,
    rating: 5,
    createdAt: dt(created),
  },
  laps,
});

const mkBook = (isbn: number, pageCount: number, title = "Test"): Book => ({
  isbn,
  title,
  authors: ["Author"],
  imageUrl: "",
  pageCount,
  publisher: "Pub",
  createdAt: dt("2025-01-01T00:00"),
});

// ============================================================
// calculateTotalReadingTimeSec
// ============================================================

describe("calculateTotalReadingTimeSec", () => {
  it("空配列は0を返す", () => {
    expect(calculateTotalReadingTimeSec([])).toBe(0);
  });

  it("複数ログの秒数を合算する", () => {
    const logs = [
      mkLog(1, [1, 10], 600, "2025-06-01T10:00"),
      mkLog(1, [10, 20], 1200, "2025-06-02T10:00"),
    ];
    expect(calculateTotalReadingTimeSec(logs)).toBe(1800);
  });
});

// ============================================================
// calculateTotalPages
// ============================================================

describe("calculateTotalPages", () => {
  it("空配列は0を返す", () => {
    expect(calculateTotalPages([])).toBe(0);
  });

  it("ページ差分を合算する", () => {
    const logs = [
      mkLog(1, [1, 50], 600, "2025-06-01T10:00"),
      mkLog(1, [50, 100], 600, "2025-06-02T10:00"),
    ];
    expect(calculateTotalPages(logs)).toBe(99); // (50-1) + (100-50)
  });
});

// ============================================================
// calculateTotalMemos
// ============================================================

describe("calculateTotalMemos", () => {
  it("空配列は0を返す", () => {
    expect(calculateTotalMemos([])).toBe(0);
  });

  it("空文字やスペースのみのメモはカウントしない", () => {
    const logs = [
      mkLog(1, [1, 10], 600, "2025-06-01T10:00", [
        { elapsedMs: 1000, note: "有効メモ", refPage: 5 },
        { elapsedMs: 2000, note: "", refPage: 6 },
        { elapsedMs: 3000, note: "   ", refPage: 7 },
      ]),
    ];
    expect(calculateTotalMemos(logs)).toBe(1);
  });
});

// ============================================================
// formatSecondsToHM
// ============================================================

describe("formatSecondsToHM", () => {
  it("0秒は '0m'", () => {
    const r = formatSecondsToHM(0);
    expect(r.formatted).toBe("0m");
    expect(r.hours).toBe(0);
    expect(r.minutes).toBe(0);
  });

  it("59分は '59m'", () => {
    expect(formatSecondsToHM(3540).formatted).toBe("59m");
  });

  it("1時間は '1h 0m'", () => {
    expect(formatSecondsToHM(3600).formatted).toBe("1h 0m");
  });

  it("1時間30分は '1h 30m'", () => {
    const r = formatSecondsToHM(5400);
    expect(r.hours).toBe(1);
    expect(r.minutes).toBe(30);
    expect(r.formatted).toBe("1h 30m");
  });
});

// ============================================================
// calculateStreak
// ============================================================

describe("calculateStreak", () => {
  const today = Temporal.PlainDate.from("2025-06-15");

  it("空配列は0を返す", () => {
    expect(calculateStreak([], today)).toBe(0);
  });

  it("今日のみのログは1を返す", () => {
    const logs = [mkLog(1, [1, 10], 600, "2025-06-15T10:00")];
    expect(calculateStreak(logs, today)).toBe(1);
  });

  it("昨日と今日は2を返す", () => {
    const logs = [
      mkLog(1, [1, 10], 600, "2025-06-14T10:00"),
      mkLog(1, [10, 20], 600, "2025-06-15T10:00"),
    ];
    expect(calculateStreak(logs, today)).toBe(2);
  });

  it("3日前にギャップがあれば2を返す", () => {
    const logs = [
      mkLog(1, [1, 10], 600, "2025-06-12T10:00"), // gap on 13th
      mkLog(1, [10, 20], 600, "2025-06-14T10:00"),
      mkLog(1, [20, 30], 600, "2025-06-15T10:00"),
    ];
    expect(calculateStreak(logs, today)).toBe(2);
  });

  it("2日以上前で途切れていれば0を返す", () => {
    const logs = [mkLog(1, [1, 10], 600, "2025-06-13T10:00")];
    expect(calculateStreak(logs, today)).toBe(0);
  });
});

// ============================================================
// calculateAverageReadingSpeed
// ============================================================

describe("calculateAverageReadingSpeed", () => {
  it("ページ0は0を返す", () => {
    expect(calculateAverageReadingSpeed(0, 3600)).toBe(0);
  });

  it("60分で10ページは6.0分/ページ", () => {
    expect(calculateAverageReadingSpeed(10, 3600)).toBe(6);
  });

  it("小数第1位に丸める", () => {
    // 100ページ, 7200秒(120分) → 1.2 分/ページ
    expect(calculateAverageReadingSpeed(100, 7200)).toBe(1.2);
  });
});

// ============================================================
// calculateBookStats / getTopBooksByReadingTime
// ============================================================

describe("calculateBookStats", () => {
  it("ログのない本のstatsはゼロ", () => {
    const books = [mkBook(1, 200)];
    const stats = calculateBookStats(books, []);
    expect(stats[0].totalSessions).toBe(0);
    expect(stats[0].totalReadingTime).toBe(0);
    expect(stats[0].pagesRead).toBe(0);
    expect(stats[0].lastRead).toBeNull();
    expect(stats[0].progressPercentage).toBe(0);
  });

  it("ログありの本のstatsが正しい", () => {
    const books = [mkBook(1, 200)];
    const logs = [
      mkLog(1, [1, 50], 600, "2025-06-01T10:00"),
      mkLog(1, [50, 100], 1200, "2025-06-02T10:00"),
    ];
    const stats = calculateBookStats(books, logs);
    expect(stats[0].totalSessions).toBe(2);
    expect(stats[0].totalReadingTime).toBe(1800);
    expect(stats[0].pagesRead).toBe(100);
    expect(stats[0].progressPercentage).toBe(50);
  });
});

describe("getTopBooksByReadingTime", () => {
  it("読書時間順にソートしてlimit件返す", () => {
    const books = [
      mkBook(1, 100, "A"),
      mkBook(2, 100, "B"),
      mkBook(3, 100, "C"),
    ];
    const logs = [
      mkLog(1, [1, 10], 100, "2025-06-01T10:00"),
      mkLog(2, [1, 10], 300, "2025-06-01T10:00"),
      mkLog(3, [1, 10], 200, "2025-06-01T10:00"),
    ];
    const stats = calculateBookStats(books, logs);
    const top = getTopBooksByReadingTime(stats, 2);
    expect(top).toHaveLength(2);
    expect(top[0].book.title).toBe("B");
    expect(top[1].book.title).toBe("C");
  });
});

// ============================================================
// computeFirstPage / computeLastPage
// ============================================================

describe("computeFirstPage", () => {
  it("空Lapは currentRefPage を返す", () => {
    expect(computeFirstPage([], 42)).toBe(42);
  });

  it("Lapの最小値を返す", () => {
    const laps = [{ refPage: 15 }, { refPage: 5 }, { refPage: 30 }];
    expect(computeFirstPage(laps, 20)).toBe(5);
  });

  it("currentRefPage が最小なら currentRefPage を返す", () => {
    const laps = [{ refPage: 10 }, { refPage: 20 }];
    expect(computeFirstPage(laps, 3)).toBe(3);
  });
});

describe("computeLastPage", () => {
  it("空Lapは currentRefPage を返す", () => {
    expect(computeLastPage([], 42)).toBe(42);
  });

  it("Lapの最大値を返す", () => {
    const laps = [{ refPage: 15 }, { refPage: 5 }, { refPage: 30 }];
    expect(computeLastPage(laps, 20)).toBe(30);
  });

  it("currentRefPage が最大なら currentRefPage を返す", () => {
    const laps = [{ refPage: 10 }, { refPage: 20 }];
    expect(computeLastPage(laps, 50)).toBe(50);
  });
});

// ============================================================
// stopwatchTimeToSeconds / secondsToStopwatchTime
// ============================================================

describe("stopwatchTimeToSeconds", () => {
  it("0:0:0 は 0", () => {
    expect(stopwatchTimeToSeconds({ h: 0, m: 0, s: 0 })).toBe(0);
  });

  it("1:30:15 は 5415", () => {
    expect(stopwatchTimeToSeconds({ h: 1, m: 30, s: 15 })).toBe(5415);
  });
});

describe("secondsToStopwatchTime", () => {
  it("0 → 0:0:0", () => {
    expect(secondsToStopwatchTime(0)).toEqual({ h: 0, m: 0, s: 0 });
  });

  it("3661 → 1:1:1", () => {
    expect(secondsToStopwatchTime(3661)).toEqual({ h: 1, m: 1, s: 1 });
  });

  it("ラウンドトリップ", () => {
    const time = { h: 2, m: 45, s: 30 };
    expect(secondsToStopwatchTime(stopwatchTimeToSeconds(time))).toEqual(time);
  });
});

// ============================================================
// filterBooks
// ============================================================

describe("filterBooks", () => {
  const books: Book[] = [
    {
      ...mkBook(1, 100, "TypeScript入門"),
      publisher: "技術評論社",
      authors: ["太郎"],
      year: 2024,
    },
    {
      ...mkBook(2, 200, "React実践"),
      publisher: "オライリー",
      authors: ["花子"],
      year: 2023,
    },
    {
      ...mkBook(3, 150, "Rust入門"),
      publisher: "技術評論社",
      authors: ["次郎"],
    },
  ];

  it("空文字ですべて返す", () => {
    expect(filterBooks(books, "")).toHaveLength(3);
    expect(filterBooks(books, "  ")).toHaveLength(3);
  });

  it("タイトルでフィルタリング", () => {
    expect(filterBooks(books, "入門")).toHaveLength(2);
  });

  it("著者名でフィルタリング", () => {
    expect(filterBooks(books, "花子")).toHaveLength(1);
    expect(filterBooks(books, "花子")[0].title).toBe("React実践");
  });

  it("出版社でフィルタリング", () => {
    expect(filterBooks(books, "オライリー")).toHaveLength(1);
  });

  it("年でフィルタリング", () => {
    expect(filterBooks(books, "2024")).toHaveLength(1);
  });

  it("大文字小文字を無視する", () => {
    expect(filterBooks(books, "typescript")).toHaveLength(1);
    expect(filterBooks(books, "REACT")).toHaveLength(1);
  });
});

// ============================================================
// calculateLogbookStatistics
// ============================================================

describe("calculateLogbookStatistics", () => {
  it("空ログでゼロ値を返す", () => {
    const result = calculateLogbookStatistics([], mkBook(1, 200));
    expect(result.totalSessions).toBe(0);
    expect(result.totalReadingTime).toBe(0);
    expect(result.pagesRead).toBe(0);
    expect(result.totalPages).toBe(200);
  });

  it("ログありで正しく計算する", () => {
    const logs = [
      mkLog(1, [1, 50], 600, "2025-06-01T10:00"),
      mkLog(1, [50, 120], 1200, "2025-06-02T10:00"),
    ];
    const result = calculateLogbookStatistics(logs, mkBook(1, 300));
    expect(result.totalSessions).toBe(2);
    expect(result.totalReadingTime).toBe(1800);
    expect(result.pagesRead).toBe(120);
    expect(result.totalPages).toBe(300);
  });

  it("book が null でも totalPages が 0 になる", () => {
    const result = calculateLogbookStatistics([], null);
    expect(result.totalPages).toBe(0);
  });
});

// ============================================================
// generateTopSessions
// ============================================================

describe("generateTopSessions", () => {
  it("空配列は空配列を返す", () => {
    expect(generateTopSessions([], 5)).toEqual([]);
  });

  it("duration降順でlimit件返す", () => {
    const logs = [
      mkLog(1, [1, 10], 100, "2025-06-01T10:00"),
      mkLog(1, [10, 30], 500, "2025-06-02T10:00"),
      mkLog(1, [30, 40], 300, "2025-06-03T10:00"),
    ];
    const top = generateTopSessions(logs, 2);
    expect(top).toHaveLength(2);
    expect(top[0].duration).toBe(500);
    expect(top[1].duration).toBe(300);
  });

  it("pages が正しく計算される", () => {
    const logs = [mkLog(1, [10, 50], 600, "2025-06-01T10:00")];
    const top = generateTopSessions(logs, 1);
    expect(top[0].pages).toBe(40);
  });
});

