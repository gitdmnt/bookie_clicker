import { BookCard } from "./BookCard";

export const BookshelfGrid = ({
  books,
  selectedBook,
  onSelect,
  setPage,
}: {
  books: Book[];
  selectedBook: Book | null;
  onSelect: (book: Book) => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => (
  <div className="flex flex-wrap overflow-x-hidden">
    {/* 行の右端の本が描画範囲から溢れてしまいそうなとき、本来は改行したいのだが、
    うまい解決方法が思い付かないので一旦保留。とりあえずoverflow-x-hiddenでごまかす。 */}
    {books.map((book) => (
      <BookCard
        key={book.isbn}
        book={book}
        isActive={book.isbn === selectedBook?.isbn}
        onSelect={() => onSelect(book)}
        setPage={setPage}
      />
    ))}
  </div>
);
