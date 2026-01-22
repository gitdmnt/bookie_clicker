import { calculateTimeSlotDistribution } from "@/pages/stats/utils";

interface TimeSlot {
  slot: string;
  count: number;
  percentage: number;
}

const slotIcons: { [key: string]: string } = {
  朝: "🌅",
  昼: "☀️",
  夕方: "🌆",
  夜: "🌙",
};

const slotColors: { [key: string]: string } = {
  朝: "bg-nb-yellow",
  昼: "bg-nb-orange",
  夕方: "bg-nb-pink-400",
  夜: "bg-nb-purple",
};

export const TimeSlotDistribution = ({
  allLogs,
}: {
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const distribution = calculateTimeSlotDistribution(allLogs);

  if (distribution.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">🕐 よく読む時間帯</h2>

      <div className="space-y-3">
        {distribution.map((item) => (
          <div key={item.slot}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{slotIcons[item.slot]}</span>
                <span className="text-sm font-bold text-gray-700">
                  {item.slot}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-600">
                  {item.count}回
                </span>
                <span className="text-lg font-black text-nb-pink-500">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="relative h-6 bg-gray-100 rounded border-2 border-black overflow-hidden">
              <div
                className={`h-full ${slotColors[item.slot]} transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">
        時間帯別の読書セッション分布
      </div>
    </div>
  );
};

export type { TimeSlot };
