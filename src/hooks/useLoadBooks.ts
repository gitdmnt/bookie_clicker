import { useState, useEffect } from "react";
import { selectElements } from "@/utils/api";

const useLoadBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const loadBooks = async () => {
    const query = { elementType: "book" };
    const result: any = await selectElements(query);
    const fetchedBooks = result.map((r: any) => r.book);
    setBooks(fetchedBooks);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  return { books, loadBooks };
};

export default useLoadBooks;
