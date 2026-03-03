import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MenuBar from "@/components/MenuBar";
import "./App.css";
import { Bookshelf } from "./pages/bookshelf";
import { Lapnote } from "./pages/lapnote";
import { Stats } from "./pages/stats";
import { Logbook } from "./pages/logbook";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";

const MainApp = () => {
  const [page, setPage] = useState(1);
  const [book, setBook] = useState<Book | null>(null);
  const pages = [
    <Lapnote book={book} />,
    <Bookshelf book={book} setBook={setBook} setPage={setPage} />,
    <Logbook book={book} />,
    <Stats />,
  ];
  const icons = ["📝", "📚", "📒", "📊"];
  return (
    <div className="min-h-screen bg-gradient-to-br from-nb-pink-50 via-white to-nb-yellow/20 flex flex-col">
      {pages[page]}
      <div className="h-20"></div>
      <MenuBar setPage={setPage} icons={icons} />
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

