import Card from "@/components/ui/Card";

interface TotalMemosCardProps {
  laps: Lap[];
}

/**
 * 総メモ数を計算
 */
const calculateTotalMemos = (laps: Lap[]): number => {
  return laps.filter((lap) => lap.note && lap.note.trim().length > 0).length;
};

export const TotalMemosCard = ({ laps }: TotalMemosCardProps) => {
  const totalMemos = calculateTotalMemos(laps);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-3xl font-black text-nb-pink-500 mb-1">
          📝 {totalMemos}
        </div>
        <div className="text-xs font-bold text-gray-600">総メモ数</div>
      </div>
    </Card>
  );
};
