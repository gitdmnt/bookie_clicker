import Card from "@/components/ui/Card";

interface MemoRateCardProps {
  laps: Lap[];
}

/**
 * メモ率を計算（%）
 */
const calculateMemoRate = (laps: Lap[]): number => {
  if (laps.length === 0) return 0;
  const memosWithNote = laps.filter(
    (lap) => lap.note && lap.note.trim().length > 0,
  ).length;
  return Math.round((memosWithNote / laps.length) * 100);
};

export const MemoRateCard = ({ laps }: MemoRateCardProps) => {
  const memoRate = calculateMemoRate(laps);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-yellow mb-1">
          {memoRate}%
        </div>
        <div className="text-xs font-bold text-gray-600">メモ記録率</div>
      </div>
    </Card>
  );
};
