import Card from "@/components/ui/Card";
import { Temporal } from "temporal-polyfill";

interface EstimatedCompletionCardProps {
  pagesRead: number;
  totalPages: number;
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 予想完読日を計算
 */
const calculateEstimatedCompletionDate = (
  pagesRead: number,
  totalPages: number,
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): string => {
  if (logs.length === 0 || pagesRead >= totalPages) return "-";

  const remainingPages = totalPages - pagesRead;

  // 過去30日間のデータから1日あたりのペースを計算
  const today = Temporal.Now.plainDateISO();
  const thirtyDaysAgo = today.subtract({ days: 30 });

  const recentLogs = logs.filter(({ readingLog }) => {
    const logDate = Temporal.PlainDate.from(readingLog.createdAt.toString());
    return Temporal.PlainDate.compare(logDate, thirtyDaysAgo) >= 0;
  });

  if (recentLogs.length === 0) return "-";

  const recentPages = recentLogs.reduce((sum, { readingLog }) => {
    return sum + (readingLog.page[1] - readingLog.page[0]);
  }, 0);

  const daysWithReading = new Set(
    recentLogs.map(({ readingLog }) => readingLog.createdAt.toString()),
  ).size;

  const pagesPerDay = recentPages / Math.min(30, daysWithReading);

  if (pagesPerDay === 0) return "-";

  const daysToComplete = Math.ceil(remainingPages / pagesPerDay);
  const completionDate = today.add({ days: daysToComplete });

  return `${completionDate.year}/${completionDate.month}/${completionDate.day}`;
};

export const EstimatedCompletionCard = ({
  pagesRead,
  totalPages,
  logs,
}: EstimatedCompletionCardProps) => {
  const completionDate = calculateEstimatedCompletionDate(
    pagesRead,
    totalPages,
    logs,
  );

  if (completionDate === "-") {
    return (
      <Card variant="default">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-600 mb-2">
            🎯 予想完読日
          </div>
          <div className="text-2xl font-black text-nb-pink-500">読了！</div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-sm font-bold text-gray-600 mb-2">
          🎯 予想完読日
        </div>
        <div className="text-2xl font-black text-nb-pink-500">
          {completionDate}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          現在のペースで読み続けた場合
        </div>
      </div>
    </Card>
  );
};
