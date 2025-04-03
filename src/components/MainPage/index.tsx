import { useRef, useState } from "react";
import AddBookModal from "./AddBookModal";
import BookDetailPage from "./BookDetailPage";
import BookCard from "./BookCard";
import { Book, StopwatchTime, LapNoteLog } from "types";
import LapNotepad from "./LapNotepad";
import useLoadBooks from "@/hooks/useLoadBooks";

const MainPage = () => {
  const { books, loadBooks } = useLoadBooks();

  // このへんうまいことhooksに切り出せないかなあ
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const time = useRef<StopwatchTime>({ h: 0, m: 0, s: 0 });
  const [lapNoteLogs, setLapNoteLogs] = useState<LapNoteLog[]>([]);

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

  const BookshelfMain = () => (
    <div className="flex flex-wrap gap-4 p-4">
      <button
        onClick={handleOpenAddBookModal}
        className="flex flex-col flex-grow items-center justify-center md:h-48 md:w-32 h-36 w-24 bg-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors"
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
  );

  return (
    <div className="bg-neutral-100 min-h-screen">
      {isModalVisible && <AddBookModal onClose={handleCloseAddBookModal} />}
      <LapNotepad
        isTimerRunning={isTimerRunning}
        setIsTimerRunning={setIsTimerRunning}
        time={time}
        lapNoteLogs={lapNoteLogs}
        setLapNoteLogs={setLapNoteLogs}
      />
      <div className="relative">
        <BookshelfMain />
        {selectedBook !== null && (
          <BookDetailPage
            book={selectedBook}
            onClose={handleCloseBookDetail}
            lapNoteLogs={lapNoteLogs}
            setLapNoteLogs={setLapNoteLogs}
          />
        )}
      </div>
    </div>
  );
};

export default MainPage;

