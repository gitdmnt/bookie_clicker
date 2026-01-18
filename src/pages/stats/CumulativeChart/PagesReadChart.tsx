import { BaseChart } from "./BaseChart";

interface PagesReadChartProps {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
  periodDays?: number;
}

export const PagesReadChart = ({
  books,
  allLogs,
  periodDays = 30,
}: PagesReadChartProps) => {
  return (
    <BaseChart
      books={books}
      allLogs={allLogs}
      periodDays={periodDays}
      title="📚 累積読了ページ数"
      color="#8b5cf6"
      unit="ページ"
      getMetricValue={(d) => d.pagesRead}
    />
  );
};
