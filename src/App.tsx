import { useState } from "react";
import MenuBar from "@/components/MenuBar";
import "./App.css";
import { Bookshelf } from "./pages/bookshelf";
import { Lapnote } from "./pages/lapnote";
import { Stats } from "./pages/stats";
import { Logbook } from "./pages/logbook";
import { Debug } from "./pages/Debug";

function App() {
  const [page, setPage] = useState(1);
  const [book, setBook] = useState<Book | null>(null);
  const pages = [
    <Lapnote book={book} />,
    <Bookshelf book={book} setBook={setBook} setPage={setPage} />,
    <Logbook book={book} />,
    <Stats />,
    <Debug />,
  ];
  const icons = ["📝", "📚", "📒", "📊", "🐞"];
  return (
    <div className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow/20 flex flex-col">
      {pages[page]}
      <div className="h-20"></div>
      <MenuBar setPage={setPage} icons={icons} />
    </div>
  );
}

export default App;
