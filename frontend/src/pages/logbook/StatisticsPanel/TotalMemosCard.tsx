import { StatsCard } from "@/components/ui/StatsCard";

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
    <StatsCard
      color="text-nb-pink-500"
      emoji="📝"
      value={totalMemos}
      title="総メモ数"
    />
  );
};
