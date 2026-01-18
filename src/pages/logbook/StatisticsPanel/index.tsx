import { ProgressCard } from "./ProgressCard";
import { TotalSessionsCard } from "./TotalSessionsCard";
import { TotalReadingTimeCard } from "./TotalReadingTimeCard";
import { StreakCard } from "./StreakCard";
import { AverageSpeedCard } from "./AverageSpeedCard";
import { AverageSessionCard } from "./AverageSessionCard";
import { LongestSessionCard } from "./LongestSessionCard";
import { WeeklyTimeCard } from "./WeeklyTimeCard";
import { MonthlyTimeCard } from "./MonthlyTimeCard";
import { MostActiveDayCard } from "./MostActiveDayCard";
import { MostActiveTimeCard } from "./MostActiveTimeCard";
import { TotalMemosCard } from "./TotalMemosCard";
import { MemoRateCard } from "./MemoRateCard";
import { AnnotatedRangeCard } from "./AnnotatedRangeCard";
import { FocusScoreCard } from "./FocusScoreCard";
import { EstimatedCompletionCard } from "./EstimatedCompletionCard";

interface StatisticsPanelProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
  laps: Lap[];
  totalSessions: number;
  totalReadingTime: number; // in seconds
  pagesRead: number;
  totalPages: number;
}

export const StatisticsPanel = ({
  logs,
  laps,
  totalSessions,
  totalReadingTime,
  pagesRead,
  totalPages,
}: StatisticsPanelProps) => {
  return (
    <div className="space-y-6">
      {/* メイン統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard pagesRead={pagesRead} totalPages={totalPages} />
        <TotalSessionsCard totalSessions={totalSessions} />
        <TotalReadingTimeCard totalReadingTime={totalReadingTime} />
      </div>

      {/* 詳細統計グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* モチベーション系 */}
        <StreakCard logs={logs} />
        <AverageSpeedCard
          pagesRead={pagesRead}
          totalReadingTime={totalReadingTime}
        />
        <AverageSessionCard logs={logs} />
        <LongestSessionCard logs={logs} />

        {/* 期間別統計 */}
        <WeeklyTimeCard logs={logs} />
        <MonthlyTimeCard logs={logs} />
        <MostActiveDayCard logs={logs} />
        <MostActiveTimeCard logs={logs} />

        {/* メモ関連 */}
        <TotalMemosCard laps={laps} />
        <MemoRateCard laps={laps} />
        <AnnotatedRangeCard laps={laps} />

        {/* 達成系 */}
        <FocusScoreCard laps={laps} />
      </div>

      {/* 予想完読日 */}
      <EstimatedCompletionCard
        pagesRead={pagesRead}
        totalPages={totalPages}
        logs={logs}
      />
    </div>
  );
};
