import { useCallback, useMemo, useState } from "react";
import AddBookModal from "./AddBookModal";
import BookDetailPage from "./BookDetailPage";
import LapNotepad from "./LapNotepad/index";
import Bookshelf from "./Bookshelf";
import useLoadBooks from "@/hooks/useLoadBooks";
// { 既存 useMainPageState を使っていた箇所を分割したフックで置換 }
import useAddBookModal from "@/hooks/useAddBookModal";
import useBookSelection from "@/hooks/useBookSelection";
import useTimer from "@/hooks/useTimer";

const MainPage = () => {
  const { books, loadBooks } = useLoadBooks();
  const {
    isAddBookModalVisible,
    open: openAddBookModal,
    close: closeAddBookModal,
  } = useAddBookModal();
  const {
    selectedBook,
    openByIsbn,
    close: closeBookDetail,
  } = useBookSelection();
  const { isRunning, start, stop, reset, time } = useTimer();

  const [lapNoteLogs, setLapNoteLogs] = useState<LapNoteLog[]>([]);

  const isTimerRunning = isRunning;
  const startTimer = start;
  const stopTimer = stop;
  const resetTimer = reset;

  const onAddClick = useCallback(() => openAddBookModal(), [openAddBookModal]);
  const onCardClick = useCallback(
    (isbn: number) => openByIsbn(isbn, books),
    [openByIsbn, books]
  );

  const memoizedBooks = useMemo(() => books, [books]);

  return (
    <div className="bg-neutral-100 min-h-screen">
      {isAddBookModalVisible && <AddBookModal onClose={closeAddBookModal} />}
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
            onClose={closeBookDetail}
            lapNoteLogs={lapNoteLogs}
            setLapNoteLogs={setLapNoteLogs}
          />
        )}
      </div>
    </div>
  );
};

export default MainPage;
