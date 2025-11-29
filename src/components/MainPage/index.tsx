import AddBookModal from "./AddBookModal";
import BookDetailPage from "./BookDetailPage";
import BookCard from "./BookCard";
import LapNotepad from "./LapNotepad/index";
import useLoadBooks from "@/hooks/useLoadBooks";
import useMainPageState from "@/hooks/useMainPageState";

const MainPage = () => {
  const { books, loadBooks } = useLoadBooks();
  const {
    isModalVisible,
    handleOpenAddBookModal,
    handleCloseAddBookModal,
    selectedBook,
    handleOpenBookDetail,
    handleCloseBookDetail,
    isTimerRunning,
    startTimer,
    stopTimer,
    resetTimer,
    time,
    lapNoteLogs,
    setLapNoteLogs,
  } = useMainPageState(books, loadBooks);

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
        startTimer={startTimer}
        stopTimer={stopTimer}
        resetTimer={resetTimer}
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
