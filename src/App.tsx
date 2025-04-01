import { useState } from "react";
import MainPage from "@/components/MainPage";
import MenuBar from "@/components/MenuBar";
import "./App.css";

function App() {
  const [page, setPage] = useState(0);
  const pages = [<MainPage />];
  return (
    <div className="min-h-screen bg-gray-50">
      {pages[page]}
      <MenuBar setPage={setPage} />
    </div>
  );
}

export default App;
