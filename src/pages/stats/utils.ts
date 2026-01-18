import { Temporal } from "temporal-polyfill";

/**
 * 完読した本の数を計算
 */
export const calculateCompletedBooks = (
  books: Book[],
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  return books.filter((book) => {
    const bookLogs = allLogs.filter(
      ({ readingLog }) => readingLog.isbn === book.isbn,
    );
    if (bookLogs.length === 0) return false;
    const pagesRead = Math.max(
      ...bookLogs.map(({ readingLog }) => readingLog.page[1]),
    );
    return pagesRead >= book.pageCount;
  }).length;
};

/**
 * 最長セッションを取得
 */
export const findLongestSession = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  if (logs.length === 0) return 0;
  return Math.max(
    ...logs.map(({ readingLog }) => readingLog.sessionDurationSec),
  );
};

/**
 * 最近の活動状況を計算
 */
export const calculateRecentActivity = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
  days: number,
): number => {
  const today = Temporal.Now.plainDateISO();
  const daysAgo = today.subtract({ days });

  return logs.filter(({ readingLog }) => {
    const logDate = Temporal.PlainDate.from(readingLog.createdAt.toString());
    return Temporal.PlainDate.compare(logDate, daysAgo) >= 0;
  }).length;
};

/**
 * 平均読書速度を計算（分/ページ）
 */
export const calculateAverageReadingSpeed = (
  totalPages: number,
  totalSeconds: number,
): number => {
  if (totalPages === 0) return 0;
  return Math.round((totalSeconds / 60 / totalPages) * 10) / 10;
};

/**
 * 読書の一貫性スコアを計算（0-100）
 */
export const calculateConsistencyScore = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  if (logs.length === 0) return 0;

  const today = Temporal.Now.plainDateISO();
  const thirtyDaysAgo = today.subtract({ days: 30 });

  // 過去30日間の読書日を取得
  const readingDates = new Set(
    logs
      .filter(({ readingLog }) => {
        const logDate = Temporal.PlainDate.from(
          readingLog.createdAt.toString(),
        );
        return Temporal.PlainDate.compare(logDate, thirtyDaysAgo) >= 0;
      })
      .map(({ readingLog }) => readingLog.createdAt.toString()),
  );

  // 30日中何日読んだかで計算
  const readingDaysCount = readingDates.size;
  return Math.round((readingDaysCount / 30) * 100);
};

/**
 * 月別読書トレンドデータを生成
 */
export const generateMonthlyTrend = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): { month: string; sessions: number; time: number; pages: number }[] => {
  if (logs.length === 0) return [];

  const monthMap = new Map<
    string,
    { sessions: number; time: number; pages: number }
  >();

  logs.forEach(({ readingLog }) => {
    const date = Temporal.PlainDate.from(readingLog.createdAt.toString());
    const monthKey = `${date.year}/${date.month}`;

    const existing = monthMap.get(monthKey) || {
      sessions: 0,
      time: 0,
      pages: 0,
    };
    monthMap.set(monthKey, {
      sessions: existing.sessions + 1,
      time: existing.time + readingLog.sessionDurationSec,
      pages: existing.pages + (readingLog.page[1] - readingLog.page[0]),
    });
  });

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .slice(-6);
};

/**
 * よく読む時間帯の分布を計算
 */
export const calculateTimeSlotDistribution = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): { slot: string; count: number; percentage: number }[] => {
  if (logs.length === 0) return [];

  const slots = new Map<string, number>();
  const slotOrder = ["朝", "昼", "夕方", "夜"];

  logs.forEach(({ readingLog }) => {
    const hour = readingLog.createdAt.hour;
    let slot: string;

    if (hour >= 5 && hour < 12) slot = "朝";
    else if (hour >= 12 && hour < 17) slot = "昼";
    else if (hour >= 17 && hour < 21) slot = "夕方";
    else slot = "夜";

    slots.set(slot, (slots.get(slot) || 0) + 1);
  });

  const total = logs.length;
  return slotOrder.map((slot) => ({
    slot,
    count: slots.get(slot) || 0,
    percentage: Math.round(((slots.get(slot) || 0) / total) * 100),
  }));
};
