import { useState } from "react";
import MainPage from "@/components/MainPage";
import MenuBar from "@/components/MenuBar";
import "./App.css";
import { Bookshelf } from "./pages/bookshelf";
import { Lapnote } from "./pages/lapnote";

function App() {
  const [page, setPage] = useState(0);
  const pages = [<Lapnote />, <Bookshelf />, <MainPage />];
  return (
    <div className="min-h-screen bg-gray-50">
      {pages[page]}
      <MenuBar setPage={setPage} />
    </div>
  );
}

export default App;
