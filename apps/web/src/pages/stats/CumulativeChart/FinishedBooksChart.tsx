import { BaseChart } from "./BaseChart";

interface FinishedBooksChartProps {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
  periodDays?: number;
}

export const FinishedBooksChart = ({
  books,
  allLogs,
  periodDays = 30,
}: FinishedBooksChartProps) => {
  return (
    <BaseChart
      books={books}
      allLogs={allLogs}
      periodDays={periodDays}
      title="🏆 累積読了冊数"
      color="#fbbf24"
      unit="冊"
      getMetricValue={(d) => d.finishedBooks}
    />
  );
};
