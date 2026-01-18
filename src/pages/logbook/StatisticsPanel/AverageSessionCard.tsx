import Card from "@/components/ui/Card";
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
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-blue mb-1">
          {formatReadingTime(avgSessionTime)}
        </div>
        <div className="text-xs font-bold text-gray-600">平均セッション</div>
      </div>
    </Card>
  );
};
