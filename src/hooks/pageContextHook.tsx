import { createContext, useState, useContext } from "react";
import "../type.d.ts";

interface PageContextType {
  page: MainPages;
  setPage: any;
  style: "init" | "usual";
  setStyle: any;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider = ({ children }: { children: React.ReactNode }) => {
  const [page, setPage] = useState<MainPages>("bookshelf");
  const [style, setStyle] = useState<"init" | "usual">("init");

  return (
    <PageContext.Provider
      value={{
        page,
        setPage,
        style,
        setStyle,
      }}
    >
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error("usePageContext must be used within a PageProvider");
  }
  return context;
};

