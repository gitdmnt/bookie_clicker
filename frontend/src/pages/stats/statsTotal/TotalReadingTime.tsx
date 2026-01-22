import { StatsCard } from "@/components/ui/StatsCard";

export const TotalReadingTime = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const totalSeconds = allLogs.reduce(
    (sum, { readingLog }) => sum + readingLog.sessionDurationSec,
    0,
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={`${hours}h ${minutes}m`}
      title="総読書時間"
    />
  );
};
