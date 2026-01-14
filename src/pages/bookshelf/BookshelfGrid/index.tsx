import { BookCard } from "./BookCard";

export const BookshelfGrid = ({
  books,
  selectedBook,
  onSelect,
  toLapnotePage,
}: {
  books: Book[];
  selectedBook: Book | null;
  onSelect: (book: Book) => void;
  toLapnotePage: () => void;
}) => (
  <div className="flex flex-wrap m-4">
    {books.map((book) => (
      <BookCard
        key={book.isbn}
        book={book}
        isActive={book.isbn === selectedBook?.isbn}
        onSelect={() => onSelect(book)}
        toLapnotePage={toLapnotePage}
      />
    ))}
  </div>
);
