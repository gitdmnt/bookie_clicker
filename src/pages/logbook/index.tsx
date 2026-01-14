import { useState, useEffect } from "react";

import { BookDisplay } from "./BookDisplay";
import { selectElements, selectLapsForLog } from "@/utils/api";
interface ReadingLogToDisplay {
  readingLog: ReadingLog;
  laps: Lap[];
}

export const Logbook = ({ book }: { book: Book | null }) => {
  const [logs, setLogs] = useState<ReadingLogToDisplay[]>([]);

  useEffect(() => {
    if (!book) {
      setLogs([]);
      return;
    }

    const isbn = book.isbn;
    const query: Query = {
      elementType: "readingLog",
      isbn: isbn,
    };

    const fetchLogs = async () => {
      try {
        const readingLogs: ReadingLog[] = await selectElements(query);
        const logsWithLaps: ReadingLogToDisplay[] = await Promise.all(
          readingLogs.map(async (log) => {
            if (!log.id) {
              return { readingLog: log, laps: [] };
            }
            const laps: Lap[] = await selectLapsForLog(log.id);
            return { readingLog: log, laps };
          })
        );
        setLogs(logsWithLaps);
      } catch (error) {
        console.error("Failed to fetch logs with laps", error);
        setLogs([]);
      }
    };

    fetchLogs();
  }, [book]);

  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <BookDisplay book={book} />
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-800">Logbook</h1>
        <p className="mt-2 text-sm text-gray-500">
          読書記録の一覧をこのページで確認します。
        </p>

        <div className="mt-4">
          {logs.length === 0 ? (
            <p className="text-gray-500">記録がありません。</p>
          ) : (
            <ul className="space-y-4">
              {logs.map(({ readingLog, laps }) => (
                <li
                  key={readingLog.id}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div>id: {readingLog.id}</div>
                  <div>Created At: {readingLog.createdAt.toString()}</div>
                  <div>
                    Session Duration (sec): {readingLog.sessionDurationSec}
                  </div>
                  <div>
                    Page: {readingLog.page[0]} - {readingLog.page[1]}
                  </div>
                  <div>Rating: {readingLog.rating}</div>
                  <div className="mt-2">
                    <h3 className="text-lg font-medium text-gray-700">Laps:</h3>
                    {laps.length === 0 ? (
                      <p className="text-gray-500">No laps recorded.</p>
                    ) : (
                      <ul className="mt-1 space-y-2">
                        {laps.map((lap) => (
                          <li
                            key={lap.id}
                            className="border-b border-neutral-200 pb-2"
                          >
                            <div>Lap ID: {lap.id}</div>
                            <div>Elapsed (ms): {lap.elapsedMs}</div>
                            <div>Note: {lap.note}</div>
                            <div>Reference Page: {lap.refPage}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
};
