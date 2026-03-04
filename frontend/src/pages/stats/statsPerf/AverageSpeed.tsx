import { StatsCard } from "@/components/ui/StatsCard";
import {
  calculateAverageReadingSpeed,
  calculateTotalPages,
  calculateTotalReadingTimeSec,
} from "@/utils/stats-helpers";

export const AverageSpeed = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const totalPages = calculateTotalPages(allLogs);
  const totalSeconds = calculateTotalReadingTimeSec(allLogs);
  const averageSpeed = calculateAverageReadingSpeed(totalPages, totalSeconds);

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={averageSpeed}
      title="平均速度(分/ページ)"
    />
  );
};

