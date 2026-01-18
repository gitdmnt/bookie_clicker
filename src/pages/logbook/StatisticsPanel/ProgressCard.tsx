import Card from "@/components/ui/Card";

interface ProgressCardProps {
  pagesRead: number;
  totalPages: number;
}

/**
 * 読書進捗率を計算
 */
const calculateProgressPercentage = (
  pagesRead: number,
  totalPages: number,
): number => {
  return totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;
};

export const ProgressCard = ({ pagesRead, totalPages }: ProgressCardProps) => {
  const progressPercentage = calculateProgressPercentage(pagesRead, totalPages);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-4xl font-black text-nb-pink-500 mb-2">
          {progressPercentage}%
        </div>
        <div className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
          読書進捗
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full border-2 border-black overflow-hidden">
          <div
            className="absolute h-full bg-nb-pink-400 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs font-semibold text-gray-500 mt-2">
          {pagesRead} / {totalPages} ページ
        </div>
      </div>
    </Card>
  );
};
