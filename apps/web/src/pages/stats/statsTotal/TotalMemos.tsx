import { StatsCard } from "@/components/ui/StatsCard";

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
      value={allLogs.reduce(
        (sum, { laps }) =>
          sum +
          laps.filter((lap) => lap.note && lap.note.trim().length > 0).length,
        0,
      )}
      title="総メモ数"
    />
  );
};
