import { useCallback, useState } from "react";
import useTimer from "@/hooks/useTimer";

export default function useMainPageState(
  books: Book[],
  loadBooks: () => Promise<void> | void
) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const { isRunning, start, stop, reset, timeRef, time, setIsRunning } =
    useTimer();

  const [lapNoteLogs, setLapNoteLogs] = useState<LapNoteLog[]>([]);

  const handleOpenAddBookModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseAddBookModal = useCallback(() => {
    setIsModalVisible(false);
    loadBooks();
  }, [loadBooks]);

  const handleOpenBookDetail = useCallback(
    (isbn: number) => {
      const book = books.find((b) => b.isbn === isbn);
      if (!book) return;
      setSelectedBook(book);
    },
    [books]
  );

  const handleCloseBookDetail = useCallback(() => {
    setSelectedBook(null);
    loadBooks();
  }, [loadBooks]);

  return {
    isModalVisible,
    handleOpenAddBookModal,
    handleCloseAddBookModal,
    selectedBook,
    handleOpenBookDetail,
    handleCloseBookDetail,
    isTimerRunning: isRunning,
    startTimer: start,
    stopTimer: stop,
    resetTimer: reset,
    time,
    timeRef,
    setIsTimerRunning: setIsRunning, // 必要なら残す
    lapNoteLogs,
    setLapNoteLogs,
  };
}
