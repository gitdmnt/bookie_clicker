import { StatsCard } from "@/components/ui/StatsCard";
import { calculateTotalPages } from "@/utils/stats-helpers";

export const TotalPages = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const totalReadPages = calculateTotalPages(allLogs);

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={totalReadPages}
      title="総読了ページ数"
    />
  );
};

