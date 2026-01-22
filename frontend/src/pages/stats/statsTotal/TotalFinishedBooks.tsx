import { StatsCard } from "@/components/ui/StatsCard";

export const isFinished = (
  book: Book,
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[],
) => {
  if (book.pageCount === 0) return false;

  // この本の読書ログのみを抽出
  const bookLogs = allLogs.filter((log) => log.readingLog.isbn === book.isbn);

  if (bookLogs.length === 0) return false;

  // ページ範囲を抽出してソート
  const ranges = bookLogs
    .map(({ readingLog }) => readingLog.page)
    .sort((a, b) => a[0] - b[0]);

  // 1から始まっているかチェック
  if (ranges[0][0] > 1) return false;

  // 範囲をマージしながらカバレッジをチェック
  const finalCovered = ranges.slice(1).reduce(
    (covered, [start, end]) => {
      if (covered === null || start > covered + 1) {
        return null; // ギャップがある
      }
      return Math.max(covered, end);
    },
    ranges[0][1] as number | null,
  );

  return finalCovered !== null && finalCovered >= book.pageCount;
};

export const TotalFinishedBooks = ({
  color,
  emoji,
  books,
  allLogs,
}: {
  color: string;
  emoji: string;
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
}) => {
  const finishedCount = books.filter((book) =>
    isFinished(book, allLogs),
  ).length;

  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={finishedCount}
      title="総読了書籍数"
    />
  );
};
