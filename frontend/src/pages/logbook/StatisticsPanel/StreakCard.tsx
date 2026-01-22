import Card from "@/components/ui/Card";
import { Temporal } from "temporal-polyfill";

interface StreakCardProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 連続読書日数（ストリーク）を計算
 */
const calculateStreak = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  if (logs.length === 0) return 0;

  const today = Temporal.Now.plainDateISO();
  const dates = logs
    .map(({ readingLog }) => readingLog.createdAt.toString())
    .map((dateStr) => Temporal.PlainDate.from(dateStr))
    .sort((a, b) => Temporal.PlainDate.compare(b, a));

  // 重複を削除
  const uniqueDates = Array.from(new Set(dates.map((d) => d.toString())))
    .map((s) => Temporal.PlainDate.from(s))
    .sort((a, b) => Temporal.PlainDate.compare(b, a));

  let streak = 0;
  let checkDate = today;

  for (const date of uniqueDates) {
    const diff = checkDate.since(date).days;

    if (diff === 0 || diff === 1) {
      streak++;
      checkDate = date;
    } else {
      break;
    }
  }

  return streak;
};

export const StreakCard = ({ logs }: StreakCardProps) => {
  const streak = calculateStreak(logs);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-orange mb-1">
          🔥 {streak}
        </div>
        <div className="text-xs font-bold text-gray-600">連続読書日数</div>
      </div>
    </Card>
  );
};
