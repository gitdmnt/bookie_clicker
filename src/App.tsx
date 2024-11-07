import { SearchWindow } from "./components/SearchWindow/main";
import { Bookshelf } from "./components/Bookshelf/main";
import { Analytics } from "./components/Analytics/main";
import { Settings } from "./components/Settings/main";
import "./App.css";
import { componentStyle } from "./styles.ts";

import { Index } from "./components/Index/main";
import { BookProvider } from "./bookContextHook.tsx";
import { PageProvider, usePageContext } from "./pageContextHook.tsx";

function App() {
  const { page, style } = usePageContext();

  const renderPage = (
    page: "search" | "bookshelf" | "analytics" | "settings"
  ) => {
    switch (page) {
      case "search":
        return <SearchWindow />;
      case "bookshelf":
        return <Bookshelf />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <PageProvider>
      <div
        className="w-screen px-24 bg-stone-100 font-sans"
        style={componentStyle.container[style]}
      >
        <h1
          className="font-title text-9xl font-bold"
          style={componentStyle.title[style]}
        >
          <div>Bookie</div>
          <div>Clicker</div>
        </h1>
        <div
          className="col-start-1 col-end-2 self-start font-title"
          style={componentStyle.index[style]}
        >
          <Index />
        </div>
        <div className="col-start-2 col-end-4 row-start-2 row-end-3">
          <BookProvider>{renderPage(page)}</BookProvider>
        </div>
      </div>
    </PageProvider>
  );
}

export default App;

