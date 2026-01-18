import { Temporal } from "temporal-polyfill";

interface TopBook {
  book: Book;
  totalSessions: number;
  totalReadingTime: number;
  pagesRead: number;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const bookStats = (
  books: Book[],
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[],
) => {
  return books.map((book) => {
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
};

export const TopBooksRanking = ({
  books,
  allLogs,
}: {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const stats = bookStats(books, allLogs);
  const topBooks = [...stats]
    .sort((a, b) => b.totalReadingTime - a.totalReadingTime)
    .slice(0, 3);

  if (topBooks.length === 0) {
    return null;
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">
        🏆 最も読んだ本 TOP3
      </h2>

      <div className="space-y-3">
        {topBooks.map((item, index) => (
          <div
            key={item.book.isbn}
            className="flex items-center gap-3 p-3 rounded-lg border-2 border-black bg-nb-pink-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-3xl flex-shrink-0">{medals[index]}</div>

            <img
              src={item.book.imageUrl}
              alt={item.book.title}
              className="h-16 w-11 rounded border-2 border-black object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />

            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-black line-clamp-2 mb-1">
                {item.book.title}
              </div>
              <div className="text-xs text-gray-600 line-clamp-1 mb-2">
                {item.book.authors}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-black text-nb-purple">
                  {formatTime(item.totalReadingTime)}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  ({item.totalSessions}セッション・{item.pagesRead}ページ)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export type { TopBook };
