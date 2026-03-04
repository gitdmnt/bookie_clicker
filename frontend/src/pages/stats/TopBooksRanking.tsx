import {
  calculateBookStats,
  getTopBooksByReadingTime,
  formatSecondsToHM,
  type BookStats,
} from "@/utils/stats-helpers";

export const TopBooksRanking = ({
  books,
  allLogs,
}: {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const stats = calculateBookStats(books, allLogs);
  const topBooks = getTopBooksByReadingTime(stats, 3);

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
                  {formatSecondsToHM(item.totalReadingTime).formatted}
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

export type { BookStats as TopBook };

