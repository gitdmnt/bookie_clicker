import { StatsCard } from "@/components/ui/StatsCard";
import { Temporal } from "temporal-polyfill";

interface MostActiveDayCardProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 最も読んだ曜日を取得
 */
const findMostActiveDay = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): string => {
  if (logs.length === 0) return "-";

  const dayNames = ["月", "火", "水", "木", "金", "土", "日"];
  const dayCounts = new Map<number, number>();

  logs.forEach(({ readingLog }) => {
    const date = Temporal.PlainDate.from(readingLog.createdAt.toString());
    const dayOfWeek = date.dayOfWeek; // 1-7
    dayCounts.set(dayOfWeek, (dayCounts.get(dayOfWeek) || 0) + 1);
  });

  let maxDay = 1;
  let maxCount = 0;

  dayCounts.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      maxDay = day;
    }
  });

  return dayNames[maxDay - 1];
};

export const MostActiveDayCard = ({ logs }: MostActiveDayCardProps) => {
  const mostActiveDay = findMostActiveDay(logs);

  return (
    <StatsCard
      color="text-nb-blue"
      emoji=""
      value={`${mostActiveDay}曜日`}
      title="最も読んだ曜日"
    />
  );
};
