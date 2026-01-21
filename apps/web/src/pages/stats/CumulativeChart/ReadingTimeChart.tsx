import { BaseChart } from "./BaseChart";

interface ReadingTimeChartProps {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
  periodDays?: number;
}

export const ReadingTimeChart = ({
  books,
  allLogs,
  periodDays = 30,
}: ReadingTimeChartProps) => {
  return (
    <BaseChart
      books={books}
      allLogs={allLogs}
      periodDays={periodDays}
      title="⏰ 累積読書時間"
      color="#ec4899"
      unit="分"
      getMetricValue={(d) => d.readingTime}
    />
  );
};
