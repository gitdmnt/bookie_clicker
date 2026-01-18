import { StatsCard } from "@/components/ui/StatsCard";

/**
 * 平均読書速度を計算（分/ページ）
 */
const calculateAverageReadingSpeed = (
  totalPages: number,
  totalSeconds: number,
): number => {
  if (totalPages === 0) return 0;
  return Math.round((totalSeconds / 60 / totalPages) * 10) / 10;
};

export const AverageSpeed = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const totalPages = allLogs.reduce(
    (sum, { readingLog }) => sum + (readingLog.page[1] - readingLog.page[0]),
    0,
  );
  const totalSeconds = allLogs.reduce(
    (sum, { readingLog }) => sum + readingLog.sessionDurationSec,
    0,
  );

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
