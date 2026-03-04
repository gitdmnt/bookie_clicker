import { StatsCard } from "@/components/ui/StatsCard";
import {
  calculateTotalReadingTimeSec,
  formatSecondsToHM,
} from "@/utils/stats-helpers";

export const TotalReadingTime = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const totalSeconds = calculateTotalReadingTimeSec(allLogs);
  const { formatted } = formatSecondsToHM(totalSeconds);

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={formatted}
      title="総読書時間"
    />
  );
};

