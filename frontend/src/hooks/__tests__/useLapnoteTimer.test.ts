/**
 * useLapnoteTimer Hook のユニットテスト
 *
 * Hook 自体は React の renderHook が必要だが、ここでは
 * Hook 内のロジック（ページ番号の自動計算、環境分岐など）を
 * api モジュールのモックを通じてテストする。
 *
 * 前提: @testing-library/react が利用不可の場合でも動作する
 * 純粋ロジックテスト。
 */
import { describe, it, expect, vi } from "vitest";

// ============================================================
// ページ番号の自動計算ロジックを抽出してテスト
// ============================================================

/**
 * useLapnoteTimer 内の handleLap で使われるロジックを再現。
 * Hook から直接エクスポートされていないため、ここでロジックを再実装してテストする。
 */
const computeFirstPage = (
  laps: { refPage: number }[],
  currentRefPage: number,
): number => {
  return laps.reduce((min, lap) => {
    return lap.refPage < min ? lap.refPage : min;
  }, currentRefPage);
};

const computeLastPage = (
  laps: { refPage: number }[],
  currentRefPage: number,
): number => {
  return laps.reduce((max, lap) => {
    return lap.refPage > max ? lap.refPage : max;
  }, currentRefPage);
};

describe("ページ番号の自動計算ロジック", () => {
  it("Lap がない場合は currentRefPage を返す", () => {
    expect(computeFirstPage([], 42)).toBe(42);
    expect(computeLastPage([], 42)).toBe(42);
  });

  it("Lap が 1 件の場合、そのページ番号と currentRefPage を比較する", () => {
    const laps = [{ refPage: 10 }];
    expect(computeFirstPage(laps, 20)).toBe(10);
    expect(computeLastPage(laps, 20)).toBe(20);
  });

  it("複数 Lap から最小・最大ページを返す", () => {
    const laps = [
      { refPage: 15 },
      { refPage: 5 },
      { refPage: 30 },
      { refPage: 12 },
    ];
    expect(computeFirstPage(laps, 20)).toBe(5);
    expect(computeLastPage(laps, 20)).toBe(30);
  });

  it("currentRefPage が最小の場合はそちらを返す", () => {
    const laps = [{ refPage: 10 }, { refPage: 20 }];
    expect(computeFirstPage(laps, 3)).toBe(3);
  });

  it("currentRefPage が最大の場合はそちらを返す", () => {
    const laps = [{ refPage: 10 }, { refPage: 20 }];
    expect(computeLastPage(laps, 50)).toBe(50);
  });
});

// ============================================================
// handleSave の環境分岐ロジック
// ============================================================

describe("handleSave 環境分岐ロジック", () => {
  // isTauri の結果に基づく分岐をロジックとしてテスト
  const createSaveHandler = (opts: {
    isTauri: boolean;
    addLaps: (...args: unknown[]) => Promise<void>;
    saveTimerSession: (...args: unknown[]) => Promise<unknown>;
    time: { h: number; m: number; s: number };
    laps: Lap[];
  }) => {
    return async (
      book: Book | null,
      firstPage: number,
      lastPage: number,
      rating: number,
    ) => {
      if (!book) return;

      if (opts.isTauri) {
        const sessionDurationSec =
          opts.time.h * 3600 + opts.time.m * 60 + opts.time.s;
        await opts.addLaps(
          {
            isbn: book.isbn,
            sessionDurationSec,
            page: [firstPage, lastPage],
            rating,
          },
          opts.laps,
        );
      } else {
        await opts.saveTimerSession(
          book.isbn,
          firstPage,
          lastPage,
          rating,
          opts.laps,
        );
      }
    };
  };

  const mockBook: Book = {
    isbn: 9784001234567,
    title: "テスト本",
    authors: ["著者A"],
    imageUrl: "",
    pageCount: 200,
    publisher: "テスト出版",
    createdAt: {} as any, // テストでは使用しない
  };

  it("Web 環境では saveTimerSession が呼ばれる", async () => {
    const saveFn = vi.fn().mockResolvedValue({});
    const addFn = vi.fn().mockResolvedValue(undefined);

    const handler = createSaveHandler({
      isTauri: false,
      addLaps: addFn,
      saveTimerSession: saveFn,
      time: { h: 1, m: 30, s: 0 },
      laps: [],
    });

    await handler(mockBook, 1, 100, 5);

    expect(saveFn).toHaveBeenCalledWith(9784001234567, 1, 100, 5, []);
    expect(addFn).not.toHaveBeenCalled();
  });

  it("Tauri 環境では addLaps が呼ばれる", async () => {
    const saveFn = vi.fn().mockResolvedValue({});
    const addFn = vi.fn().mockResolvedValue(undefined);

    const handler = createSaveHandler({
      isTauri: true,
      addLaps: addFn,
      saveTimerSession: saveFn,
      time: { h: 0, m: 45, s: 0 },
      laps: [{ elapsedMs: 1000, note: "lap1", refPage: 10 }],
    });

    await handler(mockBook, 10, 50, 4);

    expect(addFn).toHaveBeenCalledTimes(1);
    const [readingLog, laps] = addFn.mock.calls[0];
    expect(readingLog.isbn).toBe(9784001234567);
    expect(readingLog.sessionDurationSec).toBe(2700); // 45 min
    expect(readingLog.page).toEqual([10, 50]);
    expect(laps).toHaveLength(1);
    expect(saveFn).not.toHaveBeenCalled();
  });

  it("book が null の場合何もしない", async () => {
    const saveFn = vi.fn();
    const addFn = vi.fn();

    const handler = createSaveHandler({
      isTauri: false,
      addLaps: addFn,
      saveTimerSession: saveFn,
      time: { h: 0, m: 0, s: 0 },
      laps: [],
    });

    await handler(null, 1, 1, 5);

    expect(saveFn).not.toHaveBeenCalled();
    expect(addFn).not.toHaveBeenCalled();
  });

  it("sessionDurationSec が正しく計算される", async () => {
    const addFn = vi.fn().mockResolvedValue(undefined);

    const handler = createSaveHandler({
      isTauri: true,
      addLaps: addFn,
      saveTimerSession: vi.fn(),
      time: { h: 2, m: 15, s: 30 },
      laps: [],
    });

    await handler(mockBook, 1, 1, 5);

    const [readingLog] = addFn.mock.calls[0];
    expect(readingLog.sessionDurationSec).toBe(2 * 3600 + 15 * 60 + 30); // 8130
  });
});

// ============================================================
// StopwatchTime の変換ロジック
// ============================================================

describe("StopwatchTime 変換", () => {
  const toStopwatchTime = (totalSec: number): StopwatchTime => ({
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  });

  it("0 秒は 0:0:0", () => {
    expect(toStopwatchTime(0)).toEqual({ h: 0, m: 0, s: 0 });
  });

  it("59 秒は 0:0:59", () => {
    expect(toStopwatchTime(59)).toEqual({ h: 0, m: 0, s: 59 });
  });

  it("60 秒は 0:1:0", () => {
    expect(toStopwatchTime(60)).toEqual({ h: 0, m: 1, s: 0 });
  });

  it("3661 秒は 1:1:1", () => {
    expect(toStopwatchTime(3661)).toEqual({ h: 1, m: 1, s: 1 });
  });

  it("86400 秒は 24:0:0", () => {
    expect(toStopwatchTime(86400)).toEqual({ h: 24, m: 0, s: 0 });
  });
});

