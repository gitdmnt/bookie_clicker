// TODO: 本の検索をバックエンドに委譲

import { useEffect, useMemo, useState } from "react";

import useLoadBooks from "@/hooks/useLoadBooks";
import { BookshelfGrid } from "./BookshelfGrid.tsx";
import { BookshelfHeader } from "./BookshelfHeader";
import { EmptyState } from "./EmptyState";

export const Bookshelf = ({
  book,
  setBook,
  toLapnotePage,
}: {
  book: Book | null;
  setBook: React.Dispatch<React.SetStateAction<Book | null>>;
  toLapnotePage: () => void;
}) => {
  const { books, loadBooks } = useLoadBooks();
  const [searchTerm, setSearchTerm] = useState("");
  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) {
      return books;
    }
    const match = searchTerm.trim().toLowerCase();
    return books.filter((book) => {
      const titleMatch = book.title.toLowerCase().includes(match);
      const authorMatch = (book.authors ?? []).some((author) =>
        author.toLowerCase().includes(match)
      );
      const publisherMatch = book.publisher?.toLowerCase().includes(match);
      const yearMatch = String(book.year ?? "").includes(match);
      return titleMatch || authorMatch || publisherMatch || yearMatch;
    });
  }, [books, searchTerm]);

  useEffect(() => {
    if (filteredBooks.length === 0) {
      setBook(null);
      return;
    }
    const isSelectedStillVisible = filteredBooks.some(
      (book) => book.isbn === book?.isbn
    );
    if (!book || !isSelectedStillVisible) {
      setBook(filteredBooks[0]);
    }
  }, [filteredBooks, book]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <BookshelfHeader
          totalBooks={books.length}
          filteredBooks={filteredBooks.length}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onRefresh={loadBooks}
        />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {filteredBooks.length === 0 ? (
              <EmptyState onAction={loadBooks} />
            ) : (
              <BookshelfGrid
                books={filteredBooks}
                selectedBook={book}
                onSelect={(book: Book) => setBook(book)}
                toLapnotePage={toLapnotePage}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
};
