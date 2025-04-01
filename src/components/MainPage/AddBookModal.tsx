import React, { useState } from "react";
import { Book } from "@/types";
import { addElement, searchBooks } from "@/utils/api";

interface AddBookModalProps {
  onClose: () => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose }) => {
  const [searchResults, setSearchResults] = useState<Book[]>([]);

  const handleSearchBooks = async (isbn: string) => {
    const books = await searchBooks(isbn);
    setSearchResults(books);
  };

  // Add book to backend DB
  const handleAddBook = async (book: Book) => {
    await addElement("book", book);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add New Book</h2>
        <input
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          placeholder="Search by ISBN"
          onChange={(e) => handleSearchBooks(e.target.value)}
        />
        <ul>
          {searchResults.map((book) => (
            <li key={book.isbn}>
              <button
                onClick={() => handleAddBook(book)}
                className="w-full hover:bg-slate-300 p-2 text-left"
              >
                <h3>{book.title}</h3>
                <p>{(book.authors ?? []).join(", ")}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddBookModal;

