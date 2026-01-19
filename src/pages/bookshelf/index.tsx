import { useEffect, useMemo, useState } from "react";

import useLoadBooks from "@/hooks/useLoadBooks";
import { BookshelfGrid } from "./BookshelfGrid";
import { BookshelfHeader } from "./BookshelfHeader";
import { EmptyState } from "./EmptyState";
import {
  parseISBN,
  searchBooksByISBN,
  scanBarcodeISBN,
  addBook,
} from "@/utils/api";

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
  const [isbnSearchResults, setIsbnSearchResults] = useState<Book[]>([]);
  const [isSearchingISBN, setIsSearchingISBN] = useState(false);
  const [isbnError, setIsbnError] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) {
      return books;
    }
    const match = searchTerm.trim().toLowerCase();
    return books.filter((book) => {
      const titleMatch = book.title.toLowerCase().includes(match);
      const authorMatch = (book.authors ?? []).some((author) =>
        author.toLowerCase().includes(match),
      );
      const publisherMatch = book.publisher?.toLowerCase().includes(match);
      const yearMatch = String(book.year ?? "").includes(match);
      return titleMatch || authorMatch || publisherMatch || yearMatch;
    });
  }, [books, searchTerm]);

  // ISBN検索のフォールバック処理
  useEffect(() => {
    const searchISBN = async () => {
      if (!searchTerm.trim() || filteredBooks.length > 0) {
        setIsbnSearchResults([]);
        setIsbnError(null);
        return;
      }

      const isbnNumber = await parseISBN(searchTerm);

      if (isbnNumber) {
        setIsSearchingISBN(true);
        setIsbnError(null);

        try {
          const results = await searchBooksByISBN(searchTerm);
          setIsbnSearchResults(results);

          if (results.length === 0) {
            setIsbnError("NDLで該当する書籍が見つかりませんでした");
          }
        } catch (error) {
          setIsbnError("検索中にエラーが発生しました");
          setIsbnSearchResults([]);
        } finally {
          setIsSearchingISBN(false);
        }
      } else {
        setIsbnSearchResults([]);
        setIsbnError(null);
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
      setIsbnSearchResults([]);
      return;
    }

    try {
      await addBook(newBook);
      await loadBooks();
      setBook(newBook);
      setSearchTerm("");
      setIsbnSearchResults([]);
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
          isSearchingISBN ? (
            <div className="flex justify-center items-center h-80">
              <div className="text-lg font-black text-black">
                📚 NDLで検索中...
              </div>
            </div>
          ) : isbnSearchResults.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-black">NDL検索結果</h2>
              <BookshelfGrid
                books={isbnSearchResults}
                selectedBook={null}
                onSelect={handleAddBook}
                setPage={setPage}
                isAddMode={true}
              />
            </div>
          ) : (
            <EmptyState onAction={loadBooks} message={isbnError} />
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
