import { useCallback, useMemo } from "react";
import AddBookModal from "./AddBookModal";
import BookDetailPage from "./BookDetailPage";
import LapNotepad from "./LapNotepad/index";
import Bookshelf from "./Bookshelf";
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

  // 参照安定化
  const onAddClick = useCallback(
    () => handleOpenAddBookModal(),
    [handleOpenAddBookModal]
  );
  const onCardClick = useCallback(
    (isbn: number) => handleOpenBookDetail(isbn),
    [handleOpenBookDetail]
  );

  // もし books のマップが重ければ useMemo でメモ化
  const memoizedBooks = useMemo(() => books, [books]);

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
        <Bookshelf
          books={memoizedBooks}
          onAddClick={onAddClick}
          onCardClick={onCardClick}
        />
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
