import { StatsCard } from "@/components/ui/StatsCard";
import { calculateTotalMemos } from "@/utils/stats-helpers";

export const TotalMemos = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={calculateTotalMemos(allLogs)}
      title="総メモ数"
    />
  );
};

