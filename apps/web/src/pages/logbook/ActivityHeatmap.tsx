import { useMemo } from "react";
import { generateActivityData, groupByWeeks, getHeatmapColor } from "./utils";

interface ActivityHeatmapProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

export const ActivityHeatmap = ({ logs }: ActivityHeatmapProps) => {
  const activityData = useMemo(() => generateActivityData(logs), [logs]);
  const weeks = useMemo(() => groupByWeeks(activityData), [activityData]);

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-black">📊 読書アクティビティ</h2>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-black rounded-sm" />
            <div className="w-3 h-3 bg-nb-pink-200 border border-black rounded-sm" />
            <div className="w-3 h-3 bg-nb-pink-400 border border-black rounded-sm" />
            <div className="w-3 h-3 bg-nb-pink-600 border border-black rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <div key={dayIndex} className="flex gap-1">
              {weeks.map((week, weekIndex) => {
                const day = week[dayIndex];
                if (day.count === -1) {
                  return <div key={weekIndex} className="w-3 h-3" />;
                }
                return (
                  <div
                    key={weekIndex}
                    className={`w-3 h-3 border border-black rounded-sm transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(day.count)}`}
                    title={`${day.date.toString()}: ${day.count} sessions`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">
        過去1年間の読書活動
      </div>
    </div>
  );
};
