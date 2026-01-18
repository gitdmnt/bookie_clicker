import Card from "@/components/ui/Card";

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
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-pink-500 mb-1">
          {avgSpeed > 0 ? `${avgSpeed}分` : "-"}
        </div>
        <div className="text-xs font-bold text-gray-600">平均速度/ページ</div>
      </div>
    </Card>
  );
};
