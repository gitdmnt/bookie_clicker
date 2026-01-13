import { useState, useEffect, useCallback } from "react";
import { selectElements, deleteElements } from "../utils/api";

const useReadingLogs = (isbn?: number | null) => {
  const [logs, setLogs] = useState<ReadingLog[]>([]);

  const loadLogs = useCallback(async () => {
    if (!isbn) {
      setLogs([]);
      return;
    }

    try {
      const query: Query = { elementType: "readingLog", isbn };
      const result: any = await selectElements(query);
      const fetchedLogs: ReadingLog[] = result.map((r: any) => r.readingLog);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to load reading logs", error);
      setLogs([]);
    }
  }, [isbn]);

  const deleteLog = useCallback(
    async (id: string) => {
      if (!id) {
        return;
      }
      try {
        await deleteElements({ elementType: "readingLog", id });
        await loadLogs();
      } catch (error) {
        console.error("Failed to delete reading log", error);
      }
    },
    [loadLogs]
  );

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return { logs, loadLogs, deleteLog };
};

export default useReadingLogs;
