import { StatsCard } from "@/components/ui/StatsCard";
import { Temporal } from "temporal-polyfill";

/**
 * 連続読書日数を計算
 */
const calculateStreak = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): number => {
  if (logs.length === 0) return 0;

  const today = Temporal.Now.plainDateISO();
  const uniqueDates = new Set(
    logs.map(({ readingLog }) => readingLog.createdAt.toString()),
  );

  const sortedDates = Array.from(uniqueDates)
    .map((dateStr) => Temporal.PlainDate.from(dateStr))
    .sort((a, b) => Temporal.PlainDate.compare(b, a));

  if (sortedDates.length === 0) return 0;

  // 今日か昨日に読書記録があるか確認
  const yesterday = today.subtract({ days: 1 });
  const hasRecentActivity =
    Temporal.PlainDate.compare(sortedDates[0], today) === 0 ||
    Temporal.PlainDate.compare(sortedDates[0], yesterday) === 0;

  if (!hasRecentActivity) return 0;

  // 連続日数をカウント
  let streak = 1;
  let currentDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const previousDate = currentDate.subtract({ days: 1 });
    if (Temporal.PlainDate.compare(sortedDates[i], previousDate) === 0) {
      streak++;
      currentDate = sortedDates[i];
    } else {
      break;
    }
  }

  return streak;
};

export const StreakDays = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const streak = calculateStreak(allLogs);

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={streak}
      title="連続読書日数"
    />
  );
};
