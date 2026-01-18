interface SessionFrequencyData {
  month: string;
  count: number;
}

interface SessionFrequencyChartProps {
  frequencyData: SessionFrequencyData[];
}

export const SessionFrequencyChart = ({
  frequencyData,
}: SessionFrequencyChartProps) => {
  if (frequencyData.length === 0) {
    return null;
  }

  const maxCount = Math.max(...frequencyData.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <h2 className="text-xl font-black text-black mb-4">
        📊 月別セッション数
      </h2>

      <div className="flex items-end justify-between gap-2 h-48">
        {frequencyData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full bg-nb-blue rounded-t-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 flex items-center justify-center"
                style={{
                  height: `${(data.count / maxCount) * 100}%`,
                  minHeight: data.count > 0 ? "24px" : "0px",
                }}
              >
                {data.count > 0 && (
                  <span className="text-xs font-bold text-white">
                    {data.count}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs font-bold text-gray-600">{data.month}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">
        過去6ヶ月のセッション回数
      </div>
    </div>
  );
};

export type { SessionFrequencyData };
