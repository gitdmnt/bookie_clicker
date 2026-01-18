import { StatsCard } from "@/components/ui/StatsCard";
import { formatReadingTime } from "../utils";

interface AverageSessionCardProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 平均セッション時間を計算（秒）
 */
const calculateAverageSessionTime = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  if (logs.length === 0) return 0;
  const total = logs.reduce(
    (sum, { readingLog }) => sum + readingLog.sessionDurationSec,
    0,
  );
  return Math.round(total / logs.length);
};

export const AverageSessionCard = ({ logs }: AverageSessionCardProps) => {
  const avgSessionTime = calculateAverageSessionTime(logs);

  return (
    <StatsCard
      color="text-nb-blue"
      emoji=""
      value={formatReadingTime(avgSessionTime)}
      title="平均セッション"
    />
  );
};
