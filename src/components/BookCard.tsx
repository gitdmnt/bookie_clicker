import React from "react";
import { Book } from "../types";

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col md:h-48 md:w-32 h-36 w-24 bg-white rounded-lg shadow overflow-hidden"
    >
      {book.imageUrl && (
        <img
          src={book.imageUrl}
          alt={book.title}
          className="h-48 w-full object-cover box-border"
        />
      )}
      <div className="absolute bottom-0 inset-x-0 bg-gray-700 bg-opacity-50 p-2">
        <h3 className="font-medium text-sm truncate text-white">
          {book.title}
        </h3>
      </div>
    </button>
  );
};

export default BookCard;
