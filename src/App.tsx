import { SearchWindow } from "./components/SearchWindow/main";
import { Bookshelf } from "./components/Bookshelf/main";
import { Analytics } from "./components/Analytics/main";
import { Settings } from "./components/Settings/main";
import "./App.css";

import { useEffect, useState } from "react";
import { Index } from "./components/Index/main";

type Pages = "Search" | "Bookshelf" | "Analytics" | "Settings";

function App() {
  const [currPage, setCurrPage]: [Pages, any] = useState("Search");

  useEffect(() => {
    console.log(currPage);
  }, [currPage]);

  return (
    <div
      className="w-screen h-screen px-24 py-32 bg-stone-100 font-sans"
      style={styleContainerGrid}
    >
      <h1 className="col-start-1 col-end-3 row-start-1 row-end-2 self-end text-9xl font-title font-bold">
        <div>Bookie</div>
        <div>Clicker</div>
      </h1>
      <div className="col-start-1 col-end-2 row-start-2 row-end-3 self-start font-title">
        <Index currPage={currPage} handleIndex={setCurrPage} />
      </div>
      <div className="col-start-2 col-end-4 row-start-2 row-end-3">
        <div id="Search" className={page(currPage === ("Search" as Pages))}>
          <SearchWindow />
        </div>
        <div
          id="Bookshelf"
          className={page(currPage === ("Bookshelf" as Pages))}
        >
          <Bookshelf />
        </div>
        <div
          id="Analytics"
          className={page(currPage === ("Analytics" as Pages))}
        >
          <Analytics isVisible={currPage === ("Analytics" as Pages)} />
        </div>
        <div id="Settings" className={page(currPage === ("Settings" as Pages))}>
          <Settings />
        </div>
      </div>
    </div>
  );
}

const styleContainerGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gridTemplateRows: "2fr 1fr",
  gap: "0rem",
};

const page = (isVisible: boolean) => {
  return isVisible ? "" : "hidden";
};

export default App;

