import { StatsCard } from "@/components/ui/StatsCard";
import { formatReadingTime } from "../utils";

interface LongestSessionCardProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 最長セッション時間を取得（秒）
 */
const findLongestSession = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  if (logs.length === 0) return 0;
  return Math.max(
    ...logs.map(({ readingLog }) => readingLog.sessionDurationSec),
  );
};

export const LongestSessionCard = ({ logs }: LongestSessionCardProps) => {
  const longestSession = findLongestSession(logs);

  return (
    <StatsCard
      color="text-nb-purple"
      emoji=""
      value={formatReadingTime(longestSession)}
      title="最長セッション"
    />
  );
};
