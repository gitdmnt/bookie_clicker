import React from "react";
import BookCard from "./BookCard";

type Props = {
  books: Book[];
  onAddClick: () => void;
  onCardClick: (isbn: number) => void;
};

const AddBookButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Add book"
    className="flex flex-col flex-grow items-center justify-center md:h-48 md:w-32 h-36 w-24 bg-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors"
  >
    <span className="text-4xl mb-2">+</span>
    <span>Add Book</span>
  </button>
);

const Bookshelf: React.FC<Props> = ({ books, onAddClick, onCardClick }) => (
  <div className="flex flex-wrap gap-4 p-4">
    <AddBookButton onClick={onAddClick} />
    {books.map((book) => (
      <BookCard
        key={book.isbn}
        book={book}
        onClick={() => onCardClick(book.isbn)}
      />
    ))}
  </div>
);

export default React.memo(Bookshelf);
