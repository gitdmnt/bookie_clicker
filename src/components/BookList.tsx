import BookCard from "./BookCard";
import { invoke } from "@tauri-apps/api";
import { useState, useEffect } from "react";
import { Temporal } from "temporal-polyfill";
import { css } from "@emotion/react";
import { color } from "./Color";

type Book = {
  attr: {
    isbn: string;
    title: string;
    subtitle: string;
    authors: string[];
    imageUrl: string;
    totalPageCount: number;
  };
  status: {
    readStatus: string;
    combinedFlag: {
      b64: string;
    };
    progresses: {
      termStart: string;
      termEnd: string;
      flag: {
        b64: string;
      };
      memo: string;
      star: number;
    }[];
    lastRead: string;
    star: number;
  };
};

type Books = {
  items: Book[];
};

const progress = (book: Book) => {
  if (book.status.readStatus === "Read") {
    return 100;
  } else if (book.status.readStatus === "Reading") {
    let bstr = atob(book.status.combinedFlag.b64);
    let sum = Uint8Array.from(bstr, (str) => str.charCodeAt(0)).reduce(
      (sum, cur) => {
        for (let i = 0; i < 8; i++) {
          sum += (cur >> i) & 0b0000_0001;
        }
        return sum;
      },
      0
    );
    const max = book.attr.totalPageCount;
    const percentage = Math.floor((sum / max) * 100);
    return percentage;
  } else {
    return 0;
  }
};

function Booklist() {
  //const term = { start: Temporal.PlainDate.from("2024-01-01"), end: Temporal.PlainDate.from("2024-01-31") };
  const defaultBookList: [string, number][] = [];
  const [bookList, setBookList] = useState(defaultBookList);
  const defaultBookCardList: JSX.Element[] = [];
  const [bookCardList, setBookCardList] = useState(defaultBookCardList);

  useEffect(() => {
    const fn = async () => {
      const tempList: [string, number][] = [];
      const tempCardList: JSX.Element[] = [];
      const books: Books = await invoke("fetch_new");
      books.items.sort(
        (a, b) => Date.parse(b.status.lastRead) - Date.parse(a.status.lastRead)
      );
      for (let i = 0; i < books.items.length; i++) {
        const book = books.items[i];
        tempList.push([book.attr.title, progress(book)]);
        tempCardList.push(<BookCard book={book} />);
      }
      setBookList(tempList);
      setBookCardList(tempCardList);
    };
    fn();
  }, []);

  return (
    <div css={style.BookList}>
      <h2>最近読んだ本の一覧</h2>
      <ul>
        {bookList.map((e) => (
          <li>
            {e[0]}
            <div className="progressbar_container">
              <div
                className="progressbar"
                style={{ width: e[1].toString() + "%" }}
              ></div>
            </div>
          </li>
        ))}
      </ul>
      <ul>{bookCardList}</ul>
    </div>
  );
}

export default Booklist;

const style = {
  BookList: css`
    .progressbar_container {
      margin: 0;
      width: 100%;
      height: 0.2rem;
      background-color: ${color.progressbar_bg};
      .progressbar {
        height: 100%;
        background-color: ${color.progressbar_bar};
      }
    }
  `,
};

