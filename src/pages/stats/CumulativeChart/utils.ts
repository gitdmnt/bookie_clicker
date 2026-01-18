import { Temporal } from "temporal-polyfill";

export interface CumulativeDataPoint {
  date: Temporal.PlainDate;
  readingTime: number; // 累積読書時間（分）
  pagesRead: number; // 累積読了ページ数
  finishedBooks: number; // 累積読了冊数
  totalBooks: number; // 累積蔵書数
}

export const generateCumulativeData = (
  books: Book[],
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[],
  periodDays: number,
): CumulativeDataPoint[] => {
  const today = Temporal.Now.plainDateISO();
  const startDate = today.subtract({ days: periodDays - 1 });

  // 日付ごとのデータを集計
  const dataByDate = new Map<
    string,
    {
      readingTime: number;
      pagesRead: number;
      finishedBooksToday: Set<number>;
      newBooks: number;
    }
  >();

  // 読書ログを集計
  allLogs.forEach(({ readingLog }) => {
    const logDate = Temporal.PlainDate.from(readingLog.createdAt.toString());
    if (Temporal.PlainDate.compare(logDate, startDate) < 0) return;

    const dateKey = logDate.toString();
    const current = dataByDate.get(dateKey) || {
      readingTime: 0,
      pagesRead: 0,
      finishedBooksToday: new Set<number>(),
      newBooks: 0,
    };

    current.readingTime += readingLog.sessionDurationSec / 60;
    current.pagesRead += readingLog.page[1] - readingLog.page[0];

    dataByDate.set(dateKey, current);
  });

  // 書籍の追加日を集計
  books.forEach((book) => {
    const bookDate = Temporal.PlainDate.from(book.createdAt.toString());
    if (Temporal.PlainDate.compare(bookDate, startDate) < 0) return;

    const dateKey = bookDate.toString();
    const current = dataByDate.get(dateKey) || {
      readingTime: 0,
      pagesRead: 0,
      finishedBooksToday: new Set<number>(),
      newBooks: 0,
    };

    current.newBooks += 1;
    dataByDate.set(dateKey, current);
  });

  // 読了判定（全ページを読んだ本を特定）
  const finishedBooksByDate = new Map<string, Set<number>>();
  books.forEach((book) => {
    const bookLogs = allLogs.filter((log) => log.readingLog.isbn === book.isbn);
    if (bookLogs.length === 0) return;

    const maxPage = Math.max(
      ...bookLogs.map(({ readingLog }) => readingLog.page[1]),
    );
    if (maxPage < book.pageCount) return;

    // 読了した日を特定（最後のページを読んだ日）
    const finishLog = bookLogs.find(
      ({ readingLog }) => readingLog.page[1] >= book.pageCount,
    );
    if (!finishLog) return;

    const finishDate = Temporal.PlainDate.from(
      finishLog.readingLog.createdAt.toString(),
    );
    if (Temporal.PlainDate.compare(finishDate, startDate) < 0) return;

    const dateKey = finishDate.toString();
    if (!finishedBooksByDate.has(dateKey)) {
      finishedBooksByDate.set(dateKey, new Set());
    }
    finishedBooksByDate.get(dateKey)!.add(book.isbn);
  });

  // 期間開始前の累積値を計算
  let cumulativeReadingTime = 0;
  let cumulativePagesRead = 0;
  let cumulativeFinishedBooks = 0;
  let cumulativeTotalBooks = 0;

  allLogs.forEach(({ readingLog }) => {
    const logDate = Temporal.PlainDate.from(readingLog.createdAt.toString());
    if (Temporal.PlainDate.compare(logDate, startDate) < 0) {
      cumulativeReadingTime += readingLog.sessionDurationSec / 60;
      cumulativePagesRead += readingLog.page[1] - readingLog.page[0];
    }
  });

  books.forEach((book) => {
    const bookDate = Temporal.PlainDate.from(book.createdAt.toString());
    if (Temporal.PlainDate.compare(bookDate, startDate) < 0) {
      cumulativeTotalBooks += 1;

      // 期間開始前に読了していた本
      const bookLogs = allLogs.filter(
        (log) => log.readingLog.isbn === book.isbn,
      );
      const maxPage = Math.max(
        0,
        ...bookLogs.map(({ readingLog }) => readingLog.page[1]),
      );
      if (maxPage >= book.pageCount) {
        cumulativeFinishedBooks += 1;
      }
    }
  });

  // 日別の累積データを生成
  const result: CumulativeDataPoint[] = [];

  for (let i = 0; i < periodDays; i++) {
    const date = startDate.add({ days: i });
    const dateKey = date.toString();
    const dayData = dataByDate.get(dateKey);

    if (dayData) {
      cumulativeReadingTime += dayData.readingTime;
      cumulativePagesRead += dayData.pagesRead;
      cumulativeTotalBooks += dayData.newBooks;
    }

    const finishedToday = finishedBooksByDate.get(dateKey);
    if (finishedToday) {
      cumulativeFinishedBooks += finishedToday.size;
    }

    result.push({
      date,
      readingTime: Math.round(cumulativeReadingTime),
      pagesRead: cumulativePagesRead,
      finishedBooks: cumulativeFinishedBooks,
      totalBooks: cumulativeTotalBooks,
    });
  }

  return result;
};
