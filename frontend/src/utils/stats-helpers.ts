/**
 * 統計計算のための純粋関数群
 *
 * コンポーネント内に埋め込まれていた計算ロジックを抽出し、
 * テスト可能な純粋関数として提供する。
 */
import { Temporal } from "temporal-polyfill";

// ============================================================
// 共通型定義
// ============================================================

export interface ReadingLogWithLaps {
  readingLog: ReadingLog;
  laps: Lap[];
}

// ============================================================
// 集計系
// ============================================================

/** 総読書時間（秒）を計算 */
export const calculateTotalReadingTimeSec = (
  allLogs: ReadingLogWithLaps[],
): number =>
  allLogs.reduce(
    (sum, { readingLog }) => sum + readingLog.sessionDurationSec,
    0,
  );

/** 総読了ページ数を計算 */
export const calculateTotalPages = (allLogs: ReadingLogWithLaps[]): number =>
  allLogs.reduce((sum, { readingLog }) => {
    const [start, end] = readingLog.page;
    return sum + (end - start);
  }, 0);

/** 総メモ数を計算 */
export const calculateTotalMemos = (allLogs: ReadingLogWithLaps[]): number =>
  allLogs.reduce(
    (sum, { laps }) =>
      sum + laps.filter((lap) => lap.note && lap.note.trim().length > 0).length,
    0,
  );

/** 秒数をフォーマットされた時間文字列に変換 */
export const formatSecondsToHM = (
  totalSeconds: number,
): { hours: number; minutes: number; formatted: string } => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return { hours, minutes, formatted };
};

// ============================================================
// 連続読書日数
// ============================================================

/** 連続読書日数を計算 */
export const calculateStreak = (
  allLogs: ReadingLogWithLaps[],
  today?: Temporal.PlainDate,
): number => {
  if (allLogs.length === 0) return 0;

  const todayDate = today ?? Temporal.Now.plainDateISO();
  const uniqueDates = new Set(
    allLogs.map(({ readingLog }) => readingLog.createdAt.toString()),
  );

  const sortedDates = Array.from(uniqueDates)
    .map((dateStr) => Temporal.PlainDate.from(dateStr))
    .sort((a, b) => Temporal.PlainDate.compare(b, a));

  if (sortedDates.length === 0) return 0;

  const yesterday = todayDate.subtract({ days: 1 });
  const hasRecentActivity =
    Temporal.PlainDate.compare(sortedDates[0], todayDate) === 0 ||
    Temporal.PlainDate.compare(sortedDates[0], yesterday) === 0;

  if (!hasRecentActivity) return 0;

  let streak = 1;
  let currentDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const previousDate = currentDate.subtract({ days: 1 });
    if (Temporal.PlainDate.compare(sortedDates[i], previousDate) === 0) {
      streak++;
      currentDate = sortedDates[i];
    } else {
      break;
    }
  }

  return streak;
};

// ============================================================
// 平均読書速度
// ============================================================

/** 平均読書速度（分/ページ）を計算 */
export const calculateAverageReadingSpeed = (
  totalPages: number,
  totalSeconds: number,
): number => {
  if (totalPages === 0) return 0;
  return Math.round((totalSeconds / 60 / totalPages) * 10) / 10;
};

// ============================================================
// 本別統計
// ============================================================

export interface BookStats {
  book: Book;
  totalSessions: number;
  totalReadingTime: number;
  pagesRead: number;
  totalMemos: number;
  lastRead: Temporal.PlainDateTime | null;
  progressPercentage: number;
}

/** 本別の統計情報を算出 */
export const calculateBookStats = (
  books: Book[],
  allLogs: ReadingLogWithLaps[],
): BookStats[] =>
  books.map((book) => {
    const bookLogs = allLogs.filter(
      ({ readingLog }) => readingLog.isbn === book.isbn,
    );

    const totalSessions = bookLogs.length;
    const totalReadingTime = bookLogs.reduce(
      (sum, { readingLog }) => sum + readingLog.sessionDurationSec,
      0,
    );
    const pagesRead =
      bookLogs.length > 0
        ? Math.max(...bookLogs.map(({ readingLog }) => readingLog.page[1]))
        : 0;
    const totalMemos = bookLogs.reduce(
      (sum, { laps }) =>
        sum +
        laps.filter((lap) => lap.note && lap.note.trim().length > 0).length,
      0,
    );
    const lastRead =
      bookLogs.length > 0
        ? bookLogs.sort((a, b) =>
            Temporal.PlainDateTime.compare(
              b.readingLog.createdAt,
              a.readingLog.createdAt,
            ),
          )[0].readingLog.createdAt
        : null;
    const progressPercentage =
      book.pageCount > 0 ? Math.round((pagesRead / book.pageCount) * 100) : 0;

    return {
      book,
      totalSessions,
      totalReadingTime,
      pagesRead,
      totalMemos,
      lastRead,
      progressPercentage,
    };
  });

/** 読書時間上位N冊を取得 */
export const getTopBooksByReadingTime = (
  bookStats: BookStats[],
  limit: number,
): BookStats[] =>
  [...bookStats]
    .sort((a, b) => b.totalReadingTime - a.totalReadingTime)
    .slice(0, limit);

// ============================================================
// ページ番号自動計算（useLapnoteTimer から抽出）
// ============================================================

/** ラップ配列と現在のページ番号から最小ページ番号を計算 */
export const computeFirstPage = (
  laps: { refPage: number }[],
  currentRefPage: number,
): number =>
  laps.reduce(
    (min, lap) => (lap.refPage < min ? lap.refPage : min),
    currentRefPage,
  );

/** ラップ配列と現在のページ番号から最大ページ番号を計算 */
export const computeLastPage = (
  laps: { refPage: number }[],
  currentRefPage: number,
): number =>
  laps.reduce(
    (max, lap) => (lap.refPage > max ? lap.refPage : max),
    currentRefPage,
  );

// ============================================================
// セッション時間計算（useLapnoteTimer から抽出）
// ============================================================

/** StopwatchTime から秒数を計算 */
export const stopwatchTimeToSeconds = (time: StopwatchTime): number =>
  time.h * 3600 + time.m * 60 + time.s;

/** 秒数から StopwatchTime に変換 */
export const secondsToStopwatchTime = (totalSec: number): StopwatchTime => ({
  h: Math.floor(totalSec / 3600),
  m: Math.floor((totalSec % 3600) / 60),
  s: totalSec % 60,
});

// ============================================================
// 本棚フィルタリング
// ============================================================

/** 書籍をキーワードでフィルタリング */
export const filterBooks = (books: Book[], searchTerm: string): Book[] => {
  if (!searchTerm.trim()) return books;

  const match = searchTerm.trim().toLowerCase();
  return books.filter((book) => {
    const titleMatch = book.title.toLowerCase().includes(match);
    const authorMatch = (book.authors ?? []).some((author) =>
      author.toLowerCase().includes(match),
    );
    const publisherMatch = book.publisher?.toLowerCase().includes(match);
    const yearMatch = String(book.year ?? "").includes(match);
    return titleMatch || authorMatch || publisherMatch || yearMatch;
  });
};

// ============================================================
// Logbook 統計計算
// ============================================================

export interface LogbookStatistics {
  totalSessions: number;
  totalReadingTime: number;
  pagesRead: number;
  totalPages: number;
}

/** Logbook ページで使う統計情報を計算 */
export const calculateLogbookStatistics = (
  logs: ReadingLogWithLaps[],
  book: Book | null,
): LogbookStatistics => {
  const totalSessions = logs.length;
  const totalReadingTime = logs.reduce(
    (sum, { readingLog }) => sum + readingLog.sessionDurationSec,
    0,
  );
  const pagesRead =
    logs.length > 0
      ? Math.max(...logs.map(({ readingLog }) => readingLog.page[1]))
      : 0;
  const totalPages = book?.pageCount || 0;

  return { totalSessions, totalReadingTime, pagesRead, totalPages };
};

/** トップセッションデータを生成 */
export const generateTopSessions = (
  logs: ReadingLogWithLaps[],
  limit: number,
): { date: string; duration: number; pages: number }[] =>
  logs
    .map(({ readingLog }) => ({
      date: Temporal.PlainDate.from(readingLog.createdAt.toString()).toString(),
      duration: readingLog.sessionDurationSec,
      pages: readingLog.page[1] - readingLog.page[0],
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);

