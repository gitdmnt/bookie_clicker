import Card from "@/components/ui/Card";

interface MostActiveTimeCardProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

/**
 * 最も読んだ時間帯を取得
 */
const findMostActiveTimeSlot = (
  logs: { readingLog: ReadingLog; laps: Lap[] }[],
): string => {
  if (logs.length === 0) return "-";

  const timeSlots = new Map<string, number>();

  logs.forEach(({ readingLog }) => {
    const hour = readingLog.createdAt.hour;
    let slot: string;

    if (hour >= 5 && hour < 12) slot = "朝";
    else if (hour >= 12 && hour < 17) slot = "昼";
    else if (hour >= 17 && hour < 21) slot = "夕方";
    else slot = "夜";

    timeSlots.set(slot, (timeSlots.get(slot) || 0) + 1);
  });

  let maxSlot = "朝";
  let maxCount = 0;

  timeSlots.forEach((count, slot) => {
    if (count > maxCount) {
      maxCount = count;
      maxSlot = slot;
    }
  });

  return maxSlot;
};

export const MostActiveTimeCard = ({ logs }: MostActiveTimeCardProps) => {
  const mostActiveTime = findMostActiveTimeSlot(logs);

  return (
    <Card variant="default">
      <div className="text-center">
        <div className="text-2xl font-black text-nb-purple mb-1">
          {mostActiveTime}
        </div>
        <div className="text-xs font-bold text-gray-600">最も読んだ時間帯</div>
      </div>
    </Card>
  );
};
