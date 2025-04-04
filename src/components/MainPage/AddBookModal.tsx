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
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
        <div className="bg-white rounded-lg shadow-lg m-4 p-4 overflow-y-auto">
          <input
            className="w-full p-2 border border-gray-300 rounded-lg"
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
    </div>
  );
};

export default AddBookModal;
