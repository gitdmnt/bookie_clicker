import React from "react";
import { Temporal } from "temporal-polyfill";
import { ReadingLog } from "@/types";
import { deleteElements } from "@/utils/api";

interface ReadingLogCardsProps {
  logs: ReadingLog[];
  reloadLogs: () => Promise<void>;
}

const ReadingLogCards: React.FC<ReadingLogCardsProps> = ({
  logs,
  reloadLogs,
}) => {
  // Sort logs by start time ascending
  logs.sort((a, b) => {
    const aStart = Temporal.PlainDateTime.from(a.time[0]);
    const bStart = Temporal.PlainDateTime.from(b.time[0]);
    return aStart.since(bStart).total({ unit: "minute" });
  });

  // Prepare datetime info for each log
  const logsWithDatetime = logs.map((log) => {
    const start = Temporal.PlainDateTime.from(log.time[0]);
    const end = Temporal.PlainDateTime.from(log.time[1]);
    const duration = Temporal.Duration.from(end.since(start)).total({
      unit: "minute",
    });
    return { log, start, duration };
  });

  // Group logs by year
  const logsByYear = logsWithDatetime.reduce(
    (
      acc: Record<number, typeof logsWithDatetime>,
      { log, start, duration }
    ) => {
      const year = start.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push({ log, start, duration });
      return acc;
    },
    {}
  );

  const deleteLog = async (id: string) => {
    await deleteElements({ elementType: "readingLog", id });
    await reloadLogs();
  };

  return (
    <div className="m-4 card">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">読書記録</h3>
      {Object.keys(logsByYear)
        .sort((a, b) => Number(a) - Number(b))
        .map((year) => (
          <div key={year} className="mb-4">
            <h2 className="text-xl font-bold text-blue-600">{year}</h2>
            <ul className="flex flex-col gap-1 mt-2">
              {logsByYear[Number(year)].map(
                ({ log, start, duration }, index) => (
                  <li
                    key={index}
                    className="flex gap-1 p-2 hover:bg-blue-50 rounded transition-colors duration-150"
                  >
                    <div className="text-sm font-medium text-gray-400 px-2 rounded">
                      {`${start.month}/${start.day}`}
                    </div>
                    <div className="flex flex-col">
                      {log.note && <div>{log.note}</div>}
                      <div className="flex gap-1">
                        <span className="text-sm font-medium text-gray-400">
                          {Math.floor(duration / (24 * 60)) > 0 &&
                            `${Math.floor(duration / (24 * 60))}日 `}
                          {Math.floor((duration / 60) % 24) > 0 &&
                            `${Math.floor((duration / 60) % 24)}時間 `}
                          {Math.floor(duration % 60) > 0 &&
                            `${Math.floor(duration % 60)}分`}
                          {Math.floor(duration) === 0 && "0分"}
                        </span>
                        <span className="text-sm font-medium text-gray-400">
                          {`${log.page[0]} ~ ${log.page[1]}ページ`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="ml-auto"
                    >
                      <svg
                        className="w-6 h-6 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
    </div>
  );
};

export default ReadingLogCards;
