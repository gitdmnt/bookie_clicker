import React, { createContext, useContext, useState } from "react";

interface BookContextType {
  bookInfoContainer: BookInfo[];
  setBookInfoContainer: any;
  bookInfoIndex: number;
  setBookInfoIndex: any;
  activity: Activity;
  setActivity: any;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookInfoContainer, setBookInfoContainer] = useState<BookInfo[]>([]);
  const [bookInfoIndex, setBookInfoIndex] = useState(-1);
  const [activity, setActivity] = useState<Activity>(defaultActivity);

  return (
    <BookContext.Provider
      value={{
        bookInfoContainer,
        setBookInfoContainer,
        bookInfoIndex,
        setBookInfoIndex,
        activity,
        setActivity,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBookContext = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error("useBookContext must be used within a BookProvider");
  }
  return context;
};

// 定数
const today = new Date().toISOString().slice(0, 10);
const defaultActivity: Activity = {
  isbn: 0,
  range: [0, 0],
  date: today,
  memo: "",
  rating: 0,
};

