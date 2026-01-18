import { useMemo } from "react";
import { generateMonthlyTrend } from "./utils";

interface MonthlyTrendChartProps {
  logs: { readingLog: ReadingLog; laps: Lap[] }[];
}

export const MonthlyTrendChart = ({ logs }: MonthlyTrendChartProps) => {
  const trendData = useMemo(() => generateMonthlyTrend(logs), [logs]);

  if (trendData.length === 0) {
    return null;
  }

  const maxSessions = Math.max(...trendData.map((d) => d.sessions), 1);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">
        📈 月別読書トレンド
      </h2>

      <div className="space-y-4">
        {trendData.map((data, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">
                {data.month}
              </span>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span>{data.sessions}セッション</span>
                <span>{formatTime(data.time)}</span>
                <span>{data.pages}ページ</span>
              </div>
            </div>
            <div className="relative h-8 bg-gray-100 rounded border-2 border-black overflow-hidden">
              <div
                className="h-full bg-nb-pink-400 transition-all duration-500"
                style={{ width: `${(data.sessions / maxSessions) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">
        過去6ヶ月の読書活動推移
      </div>
    </div>
  );
};
