import { useState } from "react";
import MenuBar from "@/components/MenuBar";
import "./App.css";
import { Bookshelf } from "./pages/bookshelf";
import { Lapnote } from "./pages/lapnote";
import { Stats } from "./pages/stats";
import { Logbook } from "./pages/logbook";

function App() {
  const [page, setPage] = useState(0);
  const [book, setBook] = useState<Book | null>(null);
  const pages = [
    <Lapnote book={book} />,
    <Bookshelf
      book={book}
      setBook={setBook}
      toLapnotePage={() => setPage(0)}
    />,
    <Logbook book={book} />,
    <Stats />,
  ];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {pages[page]}
      <div className="h-20"></div>
      <MenuBar setPage={setPage} />
    </div>
  );
}

export default App;
