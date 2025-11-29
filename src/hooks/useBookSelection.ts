import { useState, useCallback } from "react";

export default function useBookSelection() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const open = useCallback((book: Book | null) => setSelectedBook(book), []);
  const openByIsbn = useCallback((isbn: number, books: Book[]) => {
    const book = books.find((b) => b.isbn === isbn) ?? null;
    setSelectedBook(book);
  }, []);
  const close = useCallback(() => setSelectedBook(null), []);
  return { selectedBook, open, openByIsbn, close };
}
