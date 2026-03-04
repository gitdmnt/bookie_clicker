import { StatsCard } from "@/components/ui/StatsCard";
import { calculateStreak } from "@/utils/stats-helpers";

export const StreakDays = ({
  color,
  emoji,
  allLogs,
}: {
  color: string;
  emoji: string;
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const streak = calculateStreak(allLogs);

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={streak}
      title="連続読書日数"
    />
  );
};

