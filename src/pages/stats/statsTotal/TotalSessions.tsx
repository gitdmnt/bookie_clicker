import { StatsCard } from "@/components/ui/StatsCard";

export const TotalSessions = ({
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
      value={allLogs.length}
      title="総セッション数"
    />
  );
};
