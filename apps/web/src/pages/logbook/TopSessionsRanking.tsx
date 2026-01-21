import { useMemo } from "react";
import { formatReadingTime, formatDateTime } from "./utils";

interface TopSessionsRankingProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

export const TopSessionsRanking = ({ logs }: TopSessionsRankingProps) => {
  const topSessions = useMemo(() => {
    return [...logs]
      .sort(
        (a, b) =>
          b.readingLog.sessionDurationSec - a.readingLog.sessionDurationSec,
      )
      .slice(0, 5);
  }, [logs]);

  if (topSessions.length === 0) {
    return null;
  }

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">
        🏆 最長セッション TOP5
      </h2>

      <div className="space-y-3">
        {topSessions.map((session, index) => {
          const pages = session.readingLog.page[1] - session.readingLog.page[0];
          return (
            <div
              key={session.readingLog.id}
              className="flex items-center gap-3 p-3 rounded-lg border-2 border-black bg-nb-pink-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-2xl flex-shrink-0">{medals[index]}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-black text-nb-pink-600">
                    {formatReadingTime(session.readingLog.sessionDurationSec)}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    ({pages}ページ)
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {formatDateTime(session.readingLog.createdAt)}
                </div>
                <div className="text-xs font-bold text-nb-purple mt-1">
                  p.{session.readingLog.page[0]} - p.
                  {session.readingLog.page[1]}
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="px-2 py-1 bg-white rounded border-2 border-black text-xs font-bold">
                  {session.laps.length} laps
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">
        これまでで最も長く読んだセッション
      </div>
    </div>
  );
};
