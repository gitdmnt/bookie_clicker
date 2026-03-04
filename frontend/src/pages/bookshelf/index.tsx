import { useEffect, useMemo, useState } from "react";

import useLoadBooks from "@/hooks/useLoadBooks";
import { BookshelfGrid } from "./BookshelfGrid";
import { BookshelfHeader } from "./BookshelfHeader";
import { EmptyState } from "./EmptyState";
import { searchBooksByISBN, addBook } from "@/utils/api";
import { parseIsbn } from "@/utils/isbn";
import { filterBooks } from "@/utils/stats-helpers";

type BookListResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "results"; books: Book[] }
  | { status: "no-results"; message: string }
  | { status: "error"; message: string };

export const Bookshelf = ({
  book,
  setBook,
  setPage,
}: {
  book: Book | null;
  setBook: React.Dispatch<React.SetStateAction<Book | null>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { books, loadBooks } = useLoadBooks();
  const [searchTerm, setSearchTerm] = useState("");
  const [isbnResult, setIsbnResult] = useState<BookListResult>({
    status: "idle",
  });

  const filteredBooks = useMemo(
    () => filterBooks(books, searchTerm),
    [books, searchTerm],
  );

  // ISBN検索のフォールバック処理
  useEffect(() => {
    const searchISBN = async () => {
      if (!searchTerm.trim() || filteredBooks.length > 0) {
        setIsbnResult({ status: "idle" });
        return;
      }

      const isbnNumber = await parseIsbn(searchTerm);

      if (typeof isbnNumber === "number") {
        setIsbnResult({ status: "loading" });

        try {
          const results = await searchBooksByISBN(searchTerm);
          if (results.length === 0) {
            setIsbnResult({
              status: "no-results",
              message: "NDLで該当する書籍が見つかりませんでした",
            });
          } else {
            setIsbnResult({
              status: "results",
              books: results,
            });
          }
        } catch (error) {
          setIsbnResult({
            status: "error",
            message: "検索中にエラーが発生しました",
          });
        }
      } else {
        setIsbnResult({ status: "idle" });
      }
    };

    searchISBN();
  }, [searchTerm, filteredBooks.length]);

  const handleAddBook = async (newBook: Book) => {
    // 重複チェック
    const existingBook = books.find((b) => b.isbn === newBook.isbn);
    if (existingBook) {
      setBook(existingBook);
      setSearchTerm("");
      setIsbnResult({ status: "idle" });
      return;
    }

    try {
      await addBook(newBook);
      await loadBooks();
      setBook(newBook);
      setSearchTerm("");
      setIsbnResult({ status: "idle" });
    } catch (error) {
      console.error("Failed to add book:", error);
    }
  };

  const handleBarcodeScanned = async (isbn: string) => {
    // バーコードスキャン成功時にISBN検索を実行
    setSearchTerm(isbn);
  };

  useEffect(() => {
    if (filteredBooks.length === 0) {
      setBook(null);
      return;
    }
    const isSelectedStillVisible = filteredBooks.some(
      (book) => book.isbn === book?.isbn,
    );
    if (!book || !isSelectedStillVisible) {
      setBook(filteredBooks[0]);
    }
  }, [filteredBooks, book]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow/20 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <BookshelfHeader
          totalBooks={books.length}
          filteredBooks={filteredBooks.length}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onBarcodeScanned={handleBarcodeScanned}
        />
        {filteredBooks.length === 0 ? (
          isbnResult.status === "loading" ? (
            <div className="flex justify-center items-center h-80">
              <div className="text-lg font-black text-black">
                📚 NDLで検索中...
              </div>
            </div>
          ) : isbnResult.status === "results" && isbnResult.books.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-black">NDL検索結果</h2>
              <BookshelfGrid
                books={isbnResult.books}
                selectedBook={null}
                onSelect={handleAddBook}
                setPage={setPage}
                isAddMode={true}
              />
            </div>
          ) : (
            <EmptyState
              onAction={loadBooks}
              message={
                isbnResult.status === "error" ||
                isbnResult.status === "no-results"
                  ? isbnResult.message
                  : ""
              }
            />
          )
        ) : (
          <BookshelfGrid
            books={filteredBooks}
            selectedBook={book}
            onSelect={(book: Book) => setBook(book)}
            setPage={setPage}
          />
        )}
      </div>
    </main>
  );
};

