import Register from "./components/Register";
import Analytics from "./components/Analytics";
import BookList from "./components/BookList";
import { Config } from "./components/Config";
import { color } from "./components/Color";

import { Global, css, keyframes } from "@emotion/react";
import { useState } from "react";

export default function App() {
  const [tabSelector, SelectTab] = useState(0);
  return (
    <div css={styles.App}>
      <Global styles={global} />
      <div css={sidebarStyle.container}>
        {[0, 1, 2, 3].map((e) => {
          return (
            <div css={tab(e, tabSelector)} onClick={() => SelectTab(e)}></div>
          );
        })}
      </div>
      <div css={styles.main}>
        <div css={tabSelector !== 0 && styles.none}>
          <Register />
        </div>
        <div css={tabSelector !== 1 && styles.none}>
          <BookList />
        </div>
        <div css={tabSelector !== 2 && styles.none}>
          <Analytics />
        </div>
        <div css={tabSelector !== 3 && styles.none}>
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
    min-height: 100dvh;

    background-color: ${color.bg_primary};
  `,
  none: css`
    display: none;
  `,
  main: css`
    margin-inline-end: 0.5rem;
    border-inline-start: 1px solid ${color.border_primary};
    background-color: ${color.bg_primary};
  `,
};

const animation = {
  activate: keyframes` 
      from{
        border-radius: 1.5rem;
      }
      50% {

      }
      to{
        border-radius: 1rem;
      }
    `,
  inactivate: keyframes` 
      from{
        border-radius: 1.5rem;
      }
      to{
        border-radius: 100rem;
      }
    `,
};

const sidebarStyle = {
  container: css`
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    padding: 0.5rem;

    height: calc(100dvh - 1rem);

    background-color: ${color.bg_secondary};
  `,
  selector: css`
    width: 3rem;
    height: 3rem;
    margin-block-end: 0.4rem;

    box-sizing: border-box;
    &:active {
      margin-block: 0.2rem;
    }

    border: 1px solid ${color.border_component};
    background-color: ${color.bg_component};
  `,
  inactive: css`
    animation: ${animation.inactivate} 0.1s linear;
    border-radius: 100rem;
    &:hover {
      animation: ${animation.activate} 0.1s linear;
      border-radius: 1rem;
    }
  `,
  active: css`
    border-radius: 1rem;
    border: 2px solid ${color.border_component_active};
    background-color: ${color.bg_component_active};
  `,
};

const tab = (selector: number, e: number) => {
  if (selector === e) {
    return [sidebarStyle.selector, sidebarStyle.active];
  } else {
    return [sidebarStyle.selector, sidebarStyle.inactive];
  }
};

const global = {
  html: css`
    overscroll-behavior: none;
    color: ${color.text};

    button {
      margin: 0.5rem;
      padding: 0.5rem;

      min-width: 4rem;

      box-sizing: border-box;
      border: 1px solid transparent;
      border-radius: 0.5rem;
      font-weight: bold;
      color: ${color.button_text};
      background-color: ${color.button_bg};
    }

    input {
      box-sizing: border-box;
      border: 1px solid ${color.input_border};

      background-color: ${color.input_bg};
    }
    input[type="text"] {
      margin: 0.5rem;
      padding: 0.5rem;
      width: 10rem;

      border-radius: 0.5rem;
      &:active,
      &:focus,
      &:focus-visible {
        border-color: ${color.input_border_active};
        box-shadow: none;
        outline: none;
      }
    }

    input[type="checkbox"] {
      appearance: none;
      margin: 0 0.2rem;
      padding: 0;
      width: 0.8rem;
      height: 0.8rem;
      border-radius: 0.2rem;
      vertical-align: -0.05rem;
      &:checked {
        background-color: ${color.input_border};
      }
    }
    input[type="checkbox"] + label {
      vertical-align: 0.05rem;
    }

    input[type="range"] {
      margin: 0 0.5rem;
      width: 12rem;
    }

    label {
      padding: 0.2rem 0;
      font-size: 10pt;
      color: ${color.text_accent};
      white-space: nowrap;
    }
    textarea {
      display: block;
      margin: 0.5rem;
      padding: 0.5rem;

      width: 12rem;
      min-height: 5rem;
      form-sizing: content;
      resize: none;

      box-sizing: border-box;
      border: 1px solid ${color.input_border};

      border-radius: 0.5rem;
      background-color: ${color.input_bg};
      &:active,
      &:focus,
      &:focus-visible {
        border-color: ${color.input_border_active};
        box-shadow: none;
        outline: none;
      }
    }
  `,
};

