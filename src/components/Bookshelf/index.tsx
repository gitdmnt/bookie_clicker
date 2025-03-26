import React, { useState, useEffect } from "react";
import { deleteElements, selectElements } from "@/utils/api";
import AddBookModal from "./AddBookModal";
import BookDetailPage from "./BookDetailPage";
import BookCard from "./BookCard";
import { Book } from "types";

const Bookshelf = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Load books from backend
  const loadBooks = async () => {
    const query = { elementType: "book" };
    const result: any = await selectElements(query);
    const fetchedBooks = result.map((r: any) => r.book);
    setBooks(fetchedBooks);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Modal open/close handlers
  const handleOpenAddBookModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseAddBookModal = () => {
    setIsModalVisible(false);
    loadBooks();
  };

  // Show detail and load reading logs for the selected book
  const handleShowBookDetail = async (isbn: number) => {
    const book = books.find((b) => b.isbn === isbn);
    if (!book) return;
    setSelectedBook(book);
  };

  // Delete a book then reload the list
  const handleDeleteBook = async (isbn: number | null | undefined) => {
    if (!isbn) return;
    await deleteElements({ elementType: "book", isbn });
    setSelectedBook(null);
    loadBooks();
  };

  return (
    <div className="p-4">
      {isModalVisible && <AddBookModal onClose={handleCloseAddBookModal} />}
      {selectedBook && (
        <BookDetailPage
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onDelete={handleDeleteBook}
        />
      )}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleOpenAddBookModal}
          className="flex flex-col items-center justify-center md:h-48 md:w-32 h-36 w-24 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span className="text-4xl mb-2">+</span>
          <span>Add Book</span>
        </button>
        {books.map((book) => (
          <BookCard
            key={book.isbn}
            book={book}
            onClick={() => handleShowBookDetail(book.isbn)}
          />
        ))}
      </div>
    </div>
  );
};

export default Bookshelf;
