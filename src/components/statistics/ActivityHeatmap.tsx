interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  activityData: ActivityData[];
  weeks: ActivityData[][];
}

const getHeatmapColor = (count: number): string => {
  if (count === 0) return "bg-gray-100";
  if (count === 1) return "bg-nb-pink-200";
  if (count === 2) return "bg-nb-pink-300";
  if (count === 3) return "bg-nb-pink-400";
  return "bg-nb-pink-500";
};

export const ActivityHeatmap = ({
  activityData,
  weeks,
}: ActivityHeatmapProps) => {
  const days = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">
        📅 読書活動ヒートマップ
      </h2>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          <div className="flex flex-col gap-1 mr-2">
            <div className="h-3" />
            {days.map((day, i) => (
              <div
                key={i}
                className="h-3 text-[10px] font-bold text-gray-600 flex items-center"
              >
                {day}
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm border border-gray-300 ${getHeatmapColor(
                    day.count,
                  )}`}
                  title={`${day.date}: ${day.count}回`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-600">
        <span>少</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm border border-gray-300 ${getHeatmapColor(level)}`}
            />
          ))}
        </div>
        <span>多</span>
      </div>
    </div>
  );
};

export type { ActivityData };
