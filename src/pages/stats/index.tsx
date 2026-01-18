import { useState, useEffect } from "react";
import { selectBooks, selectReadingLogs, selectLaps } from "@/utils/api";
import { TopBooksRanking } from "./TopBooksRanking";
import { TimeSlotDistribution } from "@/components/statistics/TimeSlotDistribution";
import { TotalBooks } from "./statsTotal/TotalBooks";
import { TotalSessions } from "./statsTotal/TotalSessions";
import { TotalReadingTime } from "./statsTotal/TotalReadingTime";
import { TotalFinishedBooks } from "./statsTotal/TotalFinishedBooks";
import { TotalPages } from "./statsTotal/TotalPages";
import { TotalMemos } from "./statsTotal/TotalMemos";
import { StreakDays } from "./statsMotive/StreakDays";
import { AverageSpeed } from "./statsPerf/AverageSpeed";
import { ActivityHeatmap } from "../../components/stats/ActivityHeatmap";

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

  // 本別統計

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
          <TopBooksRanking books={books} allLogs={allLogs} />
          <ActivityHeatmap allLogs={allLogs} />
          <TimeSlotDistribution allLogs={allLogs} />
        </div>
      </div>
    </main>
  );
};
