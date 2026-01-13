import { KeyboardEvent, useCallback, useRef, useState } from "react";
import Bookshelf from "./Bookshelf";
import BookDetailPage from "./BookDetailPage";
import LapNotepad from "./LapNotepad";
import useBookSelection from "@/hooks/useBookSelection";
import useLoadBooks from "@/hooks/useLoadBooks";
import useTimer from "@/hooks/useTimer";
import { addElement, exportDatabase, searchBooksByISBN } from "@/utils/api";

const MainPage = () => {
  const { books, loadBooks } = useLoadBooks();
  const {
    selectedBook,
    openByIsbn,
    close: closeSelectedBook,
  } = useBookSelection();
  const { isRunning, start, stop, reset, time } = useTimer();
  const [lapNoteLogs, setLapNoteLogs] = useState<LapNoteLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const focusSearchField = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchBooksByISBN(trimmed);
      setSearchResults(results);
    } catch (error) {
      console.error("Book search failed", error);
      setSearchError("書籍の検索に失敗しました");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearchKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleSearch();
      }
    },
    [handleSearch]
  );

  const handleAddBook = useCallback(
    async (book: Book) => {
      await addElement("book", book);
      await loadBooks();
    },
    [loadBooks]
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportStatus(null);
    try {
      const exportedPath = await exportDatabase();
      setExportStatus(`エクスポート完了: ${exportedPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "想定外のエラー";
      setExportStatus(`エクスポート失敗: ${message}`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleCardClick = useCallback(
    (isbn: number) => {
      openByIsbn(isbn, books);
    },
    [openByIsbn, books]
  );

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="flex flex-col gap-8 p-4 pb-12">
        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">1. 本の検索</h2>
            <button
              type="button"
              className="text-sm text-blue-600"
              onClick={focusSearchField}
            >
              検索欄へ
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={searchInputRef}
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="ISBNを入力"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKey}
            />
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
              onClick={() => void handleSearch()}
              disabled={isSearching}
            >
              {isSearching ? "検索中..." : "検索"}
            </button>
          </div>
          {searchError && <p className="text-sm text-red-500">{searchError}</p>}
          <div className="max-h-60 space-y-2 overflow-auto">
            {searchResults.length === 0 && !isSearching ? (
              <p className="text-sm text-neutral-500">検索結果がありません</p>
            ) : (
              searchResults.map((book) => (
                <article
                  key={book.isbn}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3"
                >
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">{book.title}</p>
                    <p className="text-xs text-neutral-500">
                      {(book.authors ?? []).join(" / ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-green-600"
                    onClick={() => void handleAddBook(book)}
                  >
                    登録
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">2. 本の記録</h2>
            <p className="text-xs text-neutral-500">
              本をタップして選択するとステップ4に反映されます
            </p>
          </div>
          <Bookshelf
            books={books}
            onAddClick={focusSearchField}
            onCardClick={handleCardClick}
          />
          <div className="rounded-xl border border-dashed border-neutral-300 p-4">
            {selectedBook ? (
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                {selectedBook.imageUrl && (
                  <img
                    src={selectedBook.imageUrl}
                    alt={selectedBook.title}
                    className="h-28 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedBook.title}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {(selectedBook.authors ?? []).join(" / ")}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {selectedBook.publisher} ・ {selectedBook.year ?? "年不明"}{" "}
                    ・ {selectedBook.pageCount}ページ
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-500"
                  onClick={closeSelectedBook}
                >
                  選択解除
                </button>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                本をタップして読書記録を紐づけましょう。
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">
              3. タイマーの測定
            </h2>
            <p className="text-xs text-neutral-500">
              メモとともにタイムを記録できます
            </p>
          </div>
          <LapNotepad
            isTimerRunning={isRunning}
            startTimer={start}
            stopTimer={stop}
            resetTimer={reset}
            time={time}
            lapNoteLogs={lapNoteLogs}
            setLapNoteLogs={setLapNoteLogs}
          />
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">
              4. 読書記録の記録
            </h2>
            <p className="text-xs text-neutral-500">
              タイマーで採取したラップノートを本に紐づけます
            </p>
          </div>
          {selectedBook ? (
            <BookDetailPage
              book={selectedBook}
              onClose={closeSelectedBook}
              lapNoteLogs={lapNoteLogs}
              setLapNoteLogs={setLapNoteLogs}
            />
          ) : (
            <p className="text-sm text-neutral-500">
              まずステップ2で本を選択してください
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">
              5. エクスポート
            </h2>
            <p className="text-xs text-neutral-500">
              登録済みデータをファイルに書き出します
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-400"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? "エクスポート中..." : "エクスポートする"}
            </button>
            {exportStatus && (
              <p className="text-sm text-neutral-600">{exportStatus}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default MainPage;
