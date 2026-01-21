import { StatsCard } from "@/components/ui/StatsCard";

interface AverageSpeedCardProps {
  pagesRead: number;
  totalReadingTime: number; // in seconds
}

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

export const AverageSpeedCard = ({
  pagesRead,
  totalReadingTime,
}: AverageSpeedCardProps) => {
  const avgSpeed = calculateAverageReadingSpeed(pagesRead, totalReadingTime);

  return (
    <StatsCard
      color="text-nb-pink-500"
      emoji=""
      value={avgSpeed > 0 ? `${avgSpeed}分` : "-"}
      title="平均速度/ページ"
    />
  );
};
