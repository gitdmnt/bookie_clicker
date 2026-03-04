/**
 * CumulativeChart/utils.ts のユニットテスト
 */
import { describe, it, expect } from "vitest";
import { Temporal } from "temporal-polyfill";
import { generateCumulativeData } from "../utils";

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
    id: `log-${isbn}-${page[0]}`,
    isbn,
    page,
    sessionDurationSec: sec,
    rating: 5,
    createdAt: dt(created),
  } as ReadingLog,
  laps: [] as Lap[],
});

const mkBook = (isbn: number, pageCount: number, created: string): Book => ({
  isbn,
  title: "Test",
  authors: ["Author"],
  imageUrl: "",
  pageCount,
  publisher: "Pub",
  createdAt: dt(created),
});

// ============================================================
// generateCumulativeData
// ============================================================

describe("generateCumulativeData", () => {
  it("データがなくても指定期間分のデータポイントを返す", () => {
    const result = generateCumulativeData([], [], 7);
    expect(result).toHaveLength(7);
    result.forEach((point) => {
      expect(point.readingTime).toBe(0);
      expect(point.pagesRead).toBe(0);
      expect(point.finishedBooks).toBe(0);
      expect(point.totalBooks).toBe(0);
    });
  });

  it("累積データが増加していく", () => {
    const today = Temporal.Now.plainDateISO();
    const yesterday = today.subtract({ days: 1 }).toString();
    const twoDaysAgo = today.subtract({ days: 2 }).toString();

    const books = [mkBook(1, 100, twoDaysAgo)];
    const logs = [
      mkLog(1, [1, 30], 1800, twoDaysAgo + "T10:00"),
      mkLog(1, [30, 60], 1200, yesterday + "T10:00"),
    ];

    const result = generateCumulativeData(books, logs, 3);
    expect(result).toHaveLength(3);

    // 累積なので後のポイントの方が大きい
    expect(result[result.length - 1].readingTime).toBeGreaterThanOrEqual(
      result[0].readingTime,
    );
    expect(result[result.length - 1].pagesRead).toBeGreaterThanOrEqual(
      result[0].pagesRead,
    );
  });

  it("periodDays=1 で今日分のみ", () => {
    const result = generateCumulativeData([], [], 1);
    expect(result).toHaveLength(1);
  });
});

