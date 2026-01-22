import { Temporal } from "temporal-polyfill";

/**
 * 秒数を時間と分の文字列にフォーマット
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * PlainDateTimeを日本語フォーマットで表示
 */
export const formatDateTime = (dt?: Temporal.PlainDateTime): string => {
  if (!dt) return "日時不明";
  return `${dt.year}年${dt.month}月${dt.day}日 ${dt.hour.toString().padStart(2, "0")}:${dt.minute.toString().padStart(2, "0")}`;
};

/**
 * 秒数を時間と分の読みやすい形式で表示
 */
export const formatReadingTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/**
 * アクティビティ数に基づいてヒートマップの色を返す
 */
export const getHeatmapColor = (count: number): string => {
  if (count === 0) return "bg-gray-100";
  if (count === 1) return "bg-nb-pink-200";
  if (count === 2) return "bg-nb-pink-400";
  if (count >= 3) return "bg-nb-pink-600";
  return "bg-gray-100";
};

/**
 * 読書ログから過去365日分のアクティビティデータを生成
 */
export const generateActivityData = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): { date: string; count: number }[] => {
  const today = Temporal.Now.plainDateISO();
  const oneYearAgo = today.subtract({ days: 364 });

  // 日付ごとのセッション数を集計
  const activityMap = new Map<string, number>();

  logs.forEach(({ readingLog }) => {
    const dateStr = readingLog.createdAt.toString();
    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
  });

  // 過去365日分のデータを生成
  const days: { date: string; count: number }[] = [];
  for (let i = 0; i < 365; i++) {
    const date = oneYearAgo.add({ days: i });
    const dateStr = date.toString();
    days.push({
      date: dateStr,
      count: activityMap.get(dateStr) || 0,
    });
  }

  return days;
};

/**
 * アクティビティデータを週ごとにグループ化
 */
export const groupByWeeks = (
  activityData: { date: string; count: number }[],
): { date: string; count: number }[][] => {
  const result: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];

  if (activityData.length === 0) return result;

  // 最初の週の開始曜日を調整
  const firstDay = activityData[0];
  const firstDate = Temporal.PlainDate.from(firstDay.date);
  const dayOfWeek = firstDate.dayOfWeek; // 1 (Monday) to 7 (Sunday)

  // 最初の週を埋める
  for (let i = 1; i < dayOfWeek; i++) {
    currentWeek.push({ date: firstDay.date, count: -1 }); // -1 は空セル
  }

  activityData.forEach((day) => {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      result.push(currentWeek);
      currentWeek = [];
    }
  });

  // 最後の週を埋める
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: activityData[activityData.length - 1].date,
        count: -1,
      });
    }
    result.push(currentWeek);
  }

  return result;
};

/**
 * ラップを指定された方法でソート
 */
export const sortLaps = (laps: Lap[], sortBy: "date" | "page"): Lap[] => {
  const sorted = [...laps];

  if (sortBy === "date") {
    return sorted.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return Temporal.PlainDateTime.compare(b.createdAt, a.createdAt);
    });
  } else {
    return sorted.sort((a, b) => {
      if (a.refPage !== b.refPage) {
        return a.refPage - b.refPage;
      }
      if (!a.createdAt || !b.createdAt) return 0;
      return Temporal.PlainDateTime.compare(b.createdAt, a.createdAt);
    });
  }
};

/**
 * 読書ペースデータを生成（週ごとのページ数）
 */
export const generateReadingPaceData = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): { week: string; pages: number }[] => {
  if (logs.length === 0) return [];

  const weekMap = new Map<string, number>();

  logs.forEach(({ readingLog }) => {
    const date = Temporal.PlainDate.from(readingLog.createdAt.toString());
    // 週の開始日（月曜日）を計算
    const weekStart = date.subtract({ days: date.dayOfWeek - 1 });
    const weekKey = `${weekStart.month}/${weekStart.day}`;

    const pages = readingLog.page[1] - readingLog.page[0];
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + pages);
  });

  return Array.from(weekMap.entries())
    .map(([week, pages]) => ({ week, pages }))
    .slice(-8); // 直近8週間
};

/**
 * セッション頻度データを生成（月ごとのセッション数）
 */
export const generateSessionFrequencyData = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): { month: string; count: number }[] => {
  if (logs.length === 0) return [];

  const monthMap = new Map<string, number>();

  logs.forEach(({ readingLog }) => {
    const date = Temporal.PlainDate.from(readingLog.createdAt.toString());
    const monthKey = `${date.year}/${date.month}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
  });

  return Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .slice(-6); // 直近6ヶ月
};
