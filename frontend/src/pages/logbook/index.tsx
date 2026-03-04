import { useState, useEffect, useMemo } from "react";

import { BookDisplay } from "./BookDisplay";
import { StatisticsPanel } from "./StatisticsPanel";
import { MemoList } from "./MemoList";
import { sortLaps } from "./utils";
import { generateReadingPaceData, generateSessionFrequencyData } from "./utils";
import { selectLaps, selectReadingLogs } from "@/utils/api";
import { ReadingPaceChart } from "@/components/statistics/ReadingPaceChart";
import { SessionFrequencyChart } from "@/components/statistics/SessionFrequencyChart";
import { TopSessionsRanking } from "@/components/statistics/TopSessionsRanking";
import {
  calculateLogbookStatistics,
  generateTopSessions,
} from "@/utils/stats-helpers";

interface ReadingLogToDisplay {
  readingLog: ReadingLog;
  laps: Lap[];
}

type SortBy = "date" | "page";

export const Logbook = ({ book }: { book: Book | null }) => {
  const [logs, setLogs] = useState<ReadingLogToDisplay[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("date");

  useEffect(() => {
    if (!book) {
      setLogs([]);
      return;
    }

    const isbn = book.isbn;
    const query: Query = {
      elementType: "readingLog",
      isbn: isbn,
    };

    const fetchLogs = async () => {
      try {
        const readingLogs: ReadingLog[] = await selectReadingLogs(query);
        const logsWithLaps: ReadingLogToDisplay[] = await Promise.all(
          readingLogs.map(async (log: ReadingLog) => {
            if (!log.id) {
              return { readingLog: log, laps: [] };
            }
            const laps: Lap[] = await selectLaps(log);
            return { readingLog: log, laps };
          }),
        );
        setLogs(logsWithLaps);
      } catch (error) {
        console.error("Failed to fetch logs with laps", error);
        setLogs([]);
      }
    };

    fetchLogs();
  }, [book]);

  // 統計情報の計算
  const statistics = useMemo(
    () => calculateLogbookStatistics(logs, book),
    [logs, book],
  );

  // 週間読書ペースデータ
  const paceData = useMemo(() => generateReadingPaceData(logs), [logs]);

  // 月別セッションデータ
  const frequencyData = useMemo(
    () => generateSessionFrequencyData(logs),
    [logs],
  );

  // トップセッションデータ
  const topSessions = useMemo(() => generateTopSessions(logs, 5), [logs]);

  // 全てのラップを集約してソート
  const sortedLaps = useMemo(() => {
    const allLaps = logs.flatMap(({ laps }) => laps);
    return sortLaps(allLaps, sortBy);
  }, [logs, sortBy]);

  if (!book) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-black text-gray-600">
              本を選択してください
            </h2>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BookDisplay book={book} />

        <StatisticsPanel
          logs={logs}
          laps={sortedLaps}
          totalSessions={statistics.totalSessions}
          totalReadingTime={statistics.totalReadingTime}
          pagesRead={statistics.pagesRead}
          totalPages={statistics.totalPages}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReadingPaceChart paceData={paceData} />
          <SessionFrequencyChart frequencyData={frequencyData} />
        </div>

        <TopSessionsRanking topSessions={topSessions} />

        <MemoList laps={sortedLaps} sortBy={sortBy} onSortChange={setSortBy} />
      </div>
    </main>
  );
};

