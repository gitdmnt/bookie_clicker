import { StatsCard } from "@/components/ui/StatsCard";

export const TotalPages = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const totalReadPages = allLogs.reduce((sum, { readingLog }) => {
    const [start, end] = readingLog.page;
    return sum + (end - start);
  }, 0);

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={totalReadPages}
      title="総読了ページ数"
    />
  );
};
