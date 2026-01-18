import { StatsCard } from "@/components/ui/StatsCard";

export const TotalBooks = ({
  color,
  emoji,
  books,
}: {
  color: string;
  emoji: string;
  books: Book[];
}) => {
  return (
    <StatsCard
      color={color}
      emoji={emoji}
      value={books.length}
      title="総書籍数"
    />
  );
};
