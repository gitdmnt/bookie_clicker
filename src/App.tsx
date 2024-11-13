import "./App.css";
import "./type.d.ts";

import { Index } from "./components/Index/main.tsx";
import { Bookshelf } from "./components/Main/Bookshelf/main.tsx";
import { Analytics } from "./components/Main/Analytics/main.tsx";
import { Settings } from "./components/Main/Settings/main.tsx";
import { BookProvider } from "./hooks/bookContextHook.tsx";
import { PageProvider, usePageContext } from "./hooks/pageContextHook.tsx";

export const App = () => {
  return (
    <PageProvider>
      <BookProvider>
        <Main />
      </BookProvider>
      <Index />
    </PageProvider>
  );
};

export default App;

const Main = () => {
  const { page } = usePageContext();

  const renderPage = (page: MainPages) => {
    switch (page) {
      case "bookshelf":
        return <Bookshelf />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
    }
  };

  return <div>{renderPage(page)}</div>;
};

