import { useState, useEffect, useMemo } from "react";
import { Temporal } from "temporal-polyfill";
import { selectBooks, selectReadingLogs, selectLaps } from "@/utils/api";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { PeriodStatsView } from "./PeriodStatsView";
import { TopBooksRanking } from "@/components/statistics/TopBooksRanking";
import { TimeSlotDistribution } from "@/components/statistics/TimeSlotDistribution";
import { calculateTimeSlotDistribution } from "./utils";
import { TotalBooks } from "./statsTotal/TotalBooks";
import { TotalSessions } from "./statsTotal/TotalSessions";
import { TotalReadingTime } from "./statsTotal/TotalReadingTime";
import { TotalFinishedBooks } from "./statsTotal/TotalFinishedBooks";
import { TotalPages } from "./statsTotal/TotalPages";
import { TotalMemos } from "./statsTotal/TotalMemos";
import { StreakDays } from "./statsMotive/StreakDays";
import { AverageSpeed } from "./statsPerf/AverageSpeed";

interface BookStats {
  book: Book;
  totalSessions: number;
  totalReadingTime: number;
  pagesRead: number;
  totalMemos: number;
  lastRead: Temporal.PlainDateTime | null;
  progressPercentage: number;
}

export const Stats = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [allLogs, setAllLogs] = useState<
    { readingLog: ReadingLog; laps: Lap[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const query = { elementType: "book" };
        const booksData = await selectBooks(query);
        setBooks(booksData);

        // 全ての本の読書ログを取得
        const logsPromises = booksData.map(async (book) => {
          const query: Query = {
            elementType: "readingLog",
            isbn: book.isbn,
          };
          const logs: ReadingLog[] = await selectReadingLogs(query);

          const logsWithLaps = await Promise.all(
            logs.map(async (log) => {
              if (!log.id) {
                return { readingLog: log, laps: [] };
              }
              const laps: Lap[] = await selectLaps(log);
              return { readingLog: log, laps };
            }),
          );

          return logsWithLaps;
        });

        const allLogsData = (await Promise.all(logsPromises)).flat();
        setAllLogs(allLogsData);
      } catch (error) {
        console.error("Failed to fetch stats data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 時間帯分布データ
  const timeSlotData = useMemo(
    () => calculateTimeSlotDistribution(allLogs),
    [allLogs],
  );

  // 本別統計
  const bookStats = useMemo<BookStats[]>(() => {
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
  }, [books, allLogs]);

  const formatReadingTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dt: Temporal.PlainDateTime | null): string => {
    if (!dt) return "-";
    return `${dt.year}/${dt.month}/${dt.day}`;
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow-50 p-8">
        <div className="mx-auto max-w-7xl text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-black text-gray-600">
            統計を読み込み中...
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ヘッダー */}
        <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
          <h1 className="text-3xl font-black text-black">📊 全体統計</h1>
          <p className="text-sm font-semibold text-gray-600 mt-2">
            すべての本の読書記録を一覧表示
          </p>
        </div>

        {/* 全体統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <TotalBooks color="text-nb-pink-500" emoji="📚" books={books} />{" "}
          <TotalFinishedBooks
            color="text-nb-yellow"
            emoji="🏆"
            books={books}
            allLogs={allLogs}
          />
          <TotalPages color="text-nb-purple" emoji="📚" allLogs={allLogs} />
          <TotalReadingTime
            color="text-nb-pink-500"
            emoji="⏰"
            allLogs={allLogs}
          />
          <TotalSessions color="text-nb-blue" emoji="📖" allLogs={allLogs} />
          <TotalMemos color="text-nb-orange" emoji="📝" allLogs={allLogs} />
        </div>

        {/* モチベーション系統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StreakDays color="text-nb-pink-500" emoji="🔥" allLogs={allLogs} />
        </div>

        {/* パフォーマンス系統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AverageSpeed color="text-nb-orange" emoji="⏱️" allLogs={allLogs} />
        </div>

        {/* グラフ・ランキングセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopBooksRanking books={bookStats} />
          <MonthlyTrendChart logs={allLogs} />
        </div>

        {/* 期間別統計（推移と累積） */}
        <PeriodStatsView logs={allLogs} />

        <TimeSlotDistribution distribution={timeSlotData} />

        {/* 本別統計テーブル */}
        <div className="rounded-lg border-3 border-black bg-white shadow-brutal-lg overflow-hidden">
          <div className="p-4 border-b-3 border-black bg-nb-pink-50">
            <h2 className="text-xl font-black text-black">📖 本別統計</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-3 border-black">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wide">
                    書籍
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase tracking-wide">
                    進捗
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase tracking-wide">
                    セッション
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase tracking-wide">
                    読書時間
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase tracking-wide">
                    メモ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase tracking-wide">
                    最終読書日
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {bookStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      <div className="text-4xl mb-2">📭</div>
                      <div className="font-semibold">
                        本が登録されていません
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookStats.map(
                    ({
                      book,
                      totalSessions,
                      totalReadingTime,
                      pagesRead,
                      totalMemos,
                      lastRead,
                      progressPercentage,
                    }) => (
                      <tr
                        key={book.isbn}
                        className="hover:bg-nb-pink-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={book.imageUrl}
                              alt={book.title}
                              className="h-16 w-11 rounded border-2 border-black object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-black line-clamp-2">
                                {book.title}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-1">
                                {book.authors}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-center">
                            <div className="text-lg font-black text-nb-pink-500">
                              {progressPercentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {pagesRead}/{book.pageCount}p
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 bg-nb-blue text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {totalSessions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-gray-700">
                            {formatReadingTime(totalReadingTime)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 bg-nb-yellow text-black text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            📝 {totalMemos}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                          {formatDate(lastRead)}
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};
