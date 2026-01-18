import { StatsCard } from "@/components/ui/StatsCard";
import { formatReadingTime } from "../utils";
import { Temporal } from "temporal-polyfill";

interface WeeklyTimeCardProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 今週の読書時間を計算（秒）
 */
const calculateWeeklyReadingTime = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  const today = Temporal.Now.plainDateISO();
  const weekAgo = today.subtract({ days: 7 });

  return logs
    .filter(({ readingLog }) => {
      const logDate = Temporal.PlainDate.from(readingLog.createdAt.toString());
      return Temporal.PlainDate.compare(logDate, weekAgo) >= 0;
    })
    .reduce((sum, { readingLog }) => sum + readingLog.sessionDurationSec, 0);
};

export const WeeklyTimeCard = ({ logs }: WeeklyTimeCardProps) => {
  const weeklyTime = calculateWeeklyReadingTime(logs);

  return (
    <StatsCard
      color="text-nb-yellow"
      emoji=""
      value={formatReadingTime(weeklyTime)}
      title="今週の読書時間"
    />
  );
};
