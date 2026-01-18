import { describe, it, expect } from "vitest";
import { Temporal } from "temporal-polyfill";
import { isFinished } from "./TotalFinishedBooks";

// テスト用ヘルパー関数
const createBook = (isbn: number, pageCount: number): Book => ({
  isbn,
  title: "Test Book",
  authors: ["Test Author"],
  publisher: "Test Publisher",
  year: 2024,
  pageCount,
  imageUrl: "",
});

const createReadingLog = (
  isbn: number,
  page: [number, number],
): { readingLog: ReadingLog; laps: Lap[] } => ({
  readingLog: {
    id: "test-log",
    isbn,
    page,
    createdAt: Temporal.Now.plainDateTimeISO(),
    sessionDurationSec: 600,
    rating: 5,
  },
  laps: [],
});

describe("isFinished", () => {
  it("ページ数が0の本はfalseを返す", () => {
    const book = createBook(1234567890, 0);
    const logs = [createReadingLog(1234567890, [1, 100])];

    expect(isFinished(book, logs)).toBe(false);
  });

  it("読書ログがない本はfalseを返す", () => {
    const book = createBook(1234567890, 300);
    const logs: { readingLog: ReadingLog; laps: Lap[] }[] = [];

    expect(isFinished(book, logs)).toBe(false);
  });

  it("1ページから始まっていない本はfalseを返す", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [10, 100]),
      createReadingLog(1234567890, [100, 300]),
    ];

    expect(isFinished(book, logs)).toBe(false);
  });

  it("ページにギャップがある本はfalseを返す", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [1, 100]),
      createReadingLog(1234567890, [150, 300]), // 100-150がギャップ
    ];

    expect(isFinished(book, logs)).toBe(false);
  });

  it("連続した1つのログで完読した本はtrueを返す", () => {
    const book = createBook(1234567890, 300);
    const logs = [createReadingLog(1234567890, [1, 300])];
    expect(isFinished(book, logs)).toBe(true);
  });

  it("複数の連続したログで完読した本はtrueを返す", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [1, 100]),
      createReadingLog(1234567890, [100, 200]),
      createReadingLog(1234567890, [200, 300]),
    ];

    expect(isFinished(book, logs)).toBe(true);
  });

  it("重複範囲があっても完読していればtrueを返す", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [1, 150]),
      createReadingLog(1234567890, [100, 250]),
      createReadingLog(1234567890, [200, 300]),
    ];

    expect(isFinished(book, logs)).toBe(true);
  });

  it("ページ数を超えて読んでいてもtrueを返す", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [1, 200]),
      createReadingLog(1234567890, [200, 350]), // 300を超える
    ];

    expect(isFinished(book, logs)).toBe(true);
  });

  it("順不同のログでも正しく判定する", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [200, 300]),
      createReadingLog(1234567890, [100, 200]),
      createReadingLog(1234567890, [1, 100]),
    ];

    expect(isFinished(book, logs)).toBe(true);
  });

  it("ページ数に足りない場合はfalseを返す", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [1, 100]),
      createReadingLog(1234567890, [100, 299]), // 299までで300に届かない
    ];

    expect(isFinished(book, logs)).toBe(false);
  });

  it("他の本のログは無視する", () => {
    const book = createBook(1234567890, 300);
    const logs = [
      createReadingLog(1234567890, [1, 100]),
      createReadingLog(987654321, [100, 300]), // 別の本
    ];

    expect(isFinished(book, logs)).toBe(false);
  });
});
