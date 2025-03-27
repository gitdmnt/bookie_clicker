import { useState } from "react";
import AddBookModal from "./AddBookModal";
import BookDetailPage from "./BookDetailPage";
import BookCard from "./BookCard";
import { Book } from "types";
import useStopwatch from "@/hooks/useStopwatch";
import useLoadBooks from "@/hooks/useLoadBooks";

const Bookshelf = () => {
  const { books, loadBooks } = useLoadBooks();
  const { time, StopwatchElement } = useStopwatch();

  // このへんうまいことhooksに切り出せないかなあ
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Modal open/close handlers
  const handleOpenAddBookModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseAddBookModal = () => {
    setIsModalVisible(false);
    loadBooks();
  };

  // Show detail and load reading logs for the selected book
  const handleOpenBookDetail = async (isbn: number) => {
    const book = books.find((b) => b.isbn === isbn);
    if (!book) return;
    setSelectedBook(book);
  };

  const handleCloseBookDetail = () => {
    setSelectedBook(null);
    loadBooks();
  };

  return (
    <div className="p-4">
      {isModalVisible && <AddBookModal onClose={handleCloseAddBookModal} />}
      {selectedBook && (
        <BookDetailPage book={selectedBook} onClose={handleCloseBookDetail} />
      )}
      <StopwatchElement />
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
            onClick={() => handleOpenBookDetail(book.isbn)}
          />
        ))}
      </div>
    </div>
  );
};

export default Bookshelf;

