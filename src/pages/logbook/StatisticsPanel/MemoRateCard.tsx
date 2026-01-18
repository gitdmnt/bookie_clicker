import { StatsCard } from "@/components/ui/StatsCard";

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
    <StatsCard
      color="text-nb-yellow"
      emoji=""
      value={`${memoRate}%`}
      title="メモ記録率"
    />
  );
};
