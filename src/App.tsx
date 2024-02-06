import Register from "./components/Register";
import Analytics from "./components/Analytics";
import BookList from "./components/BookList";
import { Config } from "./components/Config";

import { css } from "@emotion/react";
import { useState } from "react";

export default function App() {
  const [tabSelector, SelectTab] = useState(0);
  return (
    <div className="App" css={styles.App}>
      <div css={styles.tab}>
        {[0, 1, 2, 3].map((e) => {
          return (
            <div css={tab(e, tabSelector)} onClick={() => SelectTab(e)}></div>
          );
        })}
      </div>
      <div>
        <div className="register" css={tabSelector !== 0 && styles.none}>
          <Register />
        </div>
        <div className="book_list" css={tabSelector !== 1 && styles.none}>
          <BookList />
        </div>
        <div className="analytics" css={tabSelector !== 2 && styles.none}>
          <Analytics />
        </div>
        <div className="config" css={tabSelector !== 3 && styles.none}>
          <Config />
        </div>
      </div>
    </div>
  );
}

const styles = {
  App: css`
    display: grid;
    grid-template-columns: auto 1fr;
    width: 100%;
    height: 100dvh;
  `,
  title: css`
    color: red;
  `,
  none: css`
    display: none;
  `,
  tab: css`
    display: flex;
    flex-direction: column;
    margin: 0.5rem;
    padding: 0.3rem;
    background-color: #333;
    border-radius: 1rem;
  `,
  tab_selector: css`
    width: 3rem;
    height: 3rem;
    margin: 0.2rem;
    background-color: #1d1d1d;
    border-radius: 1rem;
  `,
  selected_tab: css`
    width: 3rem;
    height: 3rem;
    margin: 0.2rem;
    background-color: #1d1d1d;
    border-radius: 1rem;
  `,
};

const tab = (selector: number, e: number) => {
  if (selector === e) {
    return styles.selected_tab;
  } else {
    return styles.tab_selector;
  }
};

