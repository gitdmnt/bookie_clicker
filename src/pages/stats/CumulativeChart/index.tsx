import { ReadingTimeChart } from "./ReadingTimeChart";
import { PagesReadChart } from "./PagesReadChart";
import { FinishedBooksChart } from "./FinishedBooksChart";
import { TotalBooksChart } from "./TotalBooksChart";
import { useState } from "react";

export const CumulativeChart = ({
  books,
  allLogs,
}: {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const [selectedMetric, setSelectedMetric] = useState<
    "readingTime" | "pagesRead" | "finishedBooks" | "totalBooks"
  >("readingTime");
  const [periodDays, setPeriodDays] = useState(30);

  return (
    <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-black text-black">📈 累積推移</h2>
        <div className="flex flex-wrap gap-2">
          {/* 指標選択 */}
          <div className="flex gap-2">
            {[
              { key: "readingTime" as const, label: "⏰ 読書時間" },
              { key: "pagesRead" as const, label: "📚 ページ数" },
              { key: "finishedBooks" as const, label: "🏆 読了冊数" },
              { key: "totalBooks" as const, label: "📖 蔵書数" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSelectedMetric(item.key)}
                className={`px-3 py-1.5 text-sm font-bold rounded border-2 border-black transition-all ${
                  selectedMetric === item.key
                    ? "bg-nb-pink-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* 期間選択 */}
          <div className="flex gap-2">
            {[
              { days: 7, label: "7日" },
              { days: 30, label: "30日" },
              { days: 90, label: "90日" },
              { days: 365, label: "1年" },
            ].map((item) => (
              <button
                key={item.days}
                onClick={() => setPeriodDays(item.days)}
                className={`px-3 py-1.5 text-sm font-bold rounded border-2 border-black transition-all ${
                  periodDays === item.days
                    ? "bg-nb-blue text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {selectedMetric === "readingTime" && (
        <ReadingTimeChart
          books={books}
          allLogs={allLogs}
          periodDays={periodDays}
        />
      )}
      {selectedMetric === "pagesRead" && (
        <PagesReadChart
          books={books}
          allLogs={allLogs}
          periodDays={periodDays}
        />
      )}
      {selectedMetric === "finishedBooks" && (
        <FinishedBooksChart
          books={books}
          allLogs={allLogs}
          periodDays={periodDays}
        />
      )}
      {selectedMetric === "totalBooks" && (
        <TotalBooksChart
          books={books}
          allLogs={allLogs}
          periodDays={periodDays}
        />
      )}
    </div>
  );
};
