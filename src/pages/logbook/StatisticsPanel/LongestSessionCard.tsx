import Card from "@/components/ui/Card";
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
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-purple mb-1">
          {formatReadingTime(longestSession)}
        </div>
        <div className="text-xs font-bold text-gray-600">最長セッション</div>
      </div>
    </Card>
  );
};
