import { useMemo } from "react";
import { generateReadingPaceData } from "./utils";

interface ReadingPaceChartProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

export const ReadingPaceChart = ({ logs }: ReadingPaceChartProps) => {
  const paceData = useMemo(() => generateReadingPaceData(logs), [logs]);

  if (paceData.length === 0) {
    return null;
  }

  const maxPages = Math.max(...paceData.map((d) => d.pages), 1);

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">📈 週間読書ペース</h2>

      <div className="space-y-3">
        {paceData.map((data, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-xs font-bold text-gray-600 flex-shrink-0">
              {data.week}
            </div>
            <div className="flex-1 relative">
              <div className="h-8 bg-gray-100 rounded border-2 border-black overflow-hidden">
                <div
                  className="h-full bg-nb-pink-400 transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${(data.pages / maxPages) * 100}%` }}
                >
                  {data.pages > 0 && (
                    <span className="text-xs font-bold text-white">
                      {data.pages}p
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">
        過去8週間の読書ページ数
      </div>
    </div>
  );
};
