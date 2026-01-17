import { useState, useEffect } from "react";
import { selectBooks } from "@/utils/api";

const useLoadBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const loadBooks = async () => {
    const query = { elementType: "book" };
    const result: Book[] = await selectBooks(query);
    setBooks(result);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  return { books, loadBooks };
};

export default useLoadBooks;
