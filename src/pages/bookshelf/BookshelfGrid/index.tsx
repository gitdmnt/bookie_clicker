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
  <div className="flex flex-wrap">
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
