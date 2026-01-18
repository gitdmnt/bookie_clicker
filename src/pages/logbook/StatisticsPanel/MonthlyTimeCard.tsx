import Card from "@/components/ui/Card";
import { formatReadingTime } from "../utils";
import { Temporal } from "temporal-polyfill";

interface MonthlyTimeCardProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 今月の読書時間を計算（秒）
 */
const calculateMonthlyReadingTime = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  const today = Temporal.Now.plainDateISO();
  const monthAgo = today.subtract({ days: 30 });

  return logs
    .filter(({ readingLog }) => {
      const logDate = Temporal.PlainDate.from(readingLog.createdAt.toString());
      return Temporal.PlainDate.compare(logDate, monthAgo) >= 0;
    })
    .reduce((sum, { readingLog }) => sum + readingLog.sessionDurationSec, 0);
};

export const MonthlyTimeCard = ({ logs }: MonthlyTimeCardProps) => {
  const monthlyTime = calculateMonthlyReadingTime(logs);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-pink-400 mb-1">
          {formatReadingTime(monthlyTime)}
        </div>
        <div className="text-xs font-bold text-gray-600">今月の読書時間</div>
      </div>
    </Card>
  );
};
