import { useMemo } from "react";
import { generateSessionFrequencyData } from "./utils";

interface SessionFrequencyChartProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

export const SessionFrequencyChart = ({ logs }: SessionFrequencyChartProps) => {
  const frequencyData = useMemo(
    () => generateSessionFrequencyData(logs),
    [logs],
  );

  if (frequencyData.length === 0) {
    return null;
  }

  const maxSessions = Math.max(...frequencyData.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">
        📊 月間セッション頻度
      </h2>

      <div className="flex items-end justify-between gap-2 h-48">
        {frequencyData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col justify-end h-full">
              <div
                className="w-full bg-nb-blue rounded-t border-3 border-black shadow-brutal-sm transition-all duration-500 flex items-end justify-center pb-1"
                style={{ height: `${(data.count / maxSessions) * 100}%` }}
              >
                <span className="text-xs font-bold text-white">
                  {data.count}
                </span>
              </div>
            </div>
            <div className="text-xs font-bold text-gray-600 text-center">
              {data.month}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs font-semibold text-gray-500">
        過去6ヶ月の読書セッション数
      </div>
    </div>
  );
};
