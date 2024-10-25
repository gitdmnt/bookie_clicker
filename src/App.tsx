import { SearchWindow } from "./components/SearchWindow/main";
import { Bookshelf } from "./components/Bookshelf/main";
import { Analytics } from "./components/Analytics/main";
import { Settings } from "./components/Settings/main";
import "./App.css";

import { useEffect, useState } from "react";

function App() {
  const [page, setPage]: ["search" | "shelf" | "analytics" | "settings", any] =
    useState("search");

  const handleTab = (tab: "search" | "shelf" | "analytics" | "settings") => {
    setPage(tab);
  };
  const handleTabStyle = (
    tab: "search" | "shelf" | "analytics" | "settings"
  ) => {
    if (page === tab) {
      return "bg-white";
    } else {
      return "bg-gray-200";
    }
  };
  const handlePageStyle = (
    tab: "search" | "shelf" | "analytics" | "settings"
  ) => {
    const defaultStyle = "grid bg-white";
    if (page === tab) {
      return defaultStyle + " block";
    } else {
      return defaultStyle + " hidden";
    }
  };

  useEffect(() => {
    console.log(page);
  }, [page]);
  return (
    <div className="w-screen font-sans bg-gray-200">
      <header className="grid grid-cols-4 mx-20 bg-white *:px-6 *:py-2 *:max-w-xs">
        <div
          className={handleTabStyle("search")}
          onClick={() => handleTab("search")}
        >
          さがす
        </div>
        <div
          className={handleTabStyle("shelf")}
          onClick={() => handleTab("shelf")}
        >
          本棚
        </div>
        <div
          className={handleTabStyle("analytics")}
          onClick={() => handleTab("analytics")}
        >
          統計
        </div>
        <div
          className={handleTabStyle("settings")}
          onClick={() => handleTab("settings")}
        >
          設定
        </div>
      </header>
      <div className={handlePageStyle("search")}>
        <SearchWindow />
      </div>
      <div className={handlePageStyle("shelf")}>
        <Bookshelf />
      </div>
      <div className={handlePageStyle("analytics")}>
        <Analytics isVisible={page === "analytics"} />
      </div>
      <div className={handlePageStyle("settings")}>
        <Settings />
      </div>
    </div>
  );
}

export default App;

