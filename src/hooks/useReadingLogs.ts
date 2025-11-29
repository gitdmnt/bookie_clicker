import { useState, useEffect } from "react";
import { selectElements, deleteElements } from "../utils/api";

const useReadingLogs = (isbn: number) => {
  const [logs, setLogs] = useState<ReadingLog[]>([]);

  const loadLogs = async () => {
    try {
      const query: Query = { elementType: "readingLog", isbn };
      const result: any = await selectElements(query);
      const fetchedLogs: ReadingLog[] = result.map((r: any) => r.readingLog);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to load reading logs", error);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      await deleteElements({ elementType: "readingLog", id });
      await loadLogs();
    } catch (error) {
      console.error("Failed to delete reading log", error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [isbn]);

  return { logs, loadLogs, deleteLog };
};

export default useReadingLogs;
