import { BaseChart } from "./BaseChart";

interface TotalBooksChartProps {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
  periodDays?: number;
}

export const TotalBooksChart = ({
  books,
  allLogs,
  periodDays = 30,
}: TotalBooksChartProps) => {
  return (
    <BaseChart
      books={books}
      allLogs={allLogs}
      periodDays={periodDays}
      title="📖 累積蔵書数"
      color="#3b82f6"
      unit="冊"
      getMetricValue={(d) => d.totalBooks}
    />
  );
};
