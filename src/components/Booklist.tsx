import Bookdata from "./BookCard";
import { invoke } from "@tauri-apps/api";
import { useState } from "react";
import { Temporal } from "temporal-polyfill";

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

function Booklist() {
  //const term = { start: Temporal.PlainDate.from("2024-01-01"), end: Temporal.PlainDate.from("2024-01-31") };

  const defaultBookList: JSX.Element[] = [<li>a</li>];
  const [bookList, setBookList] = useState(defaultBookList);
  const fetchBook = async () => {
    const books: Books = await invoke("fetch_new");
    books.items.sort(
      (a, b) => Date.parse(b.status.lastRead) - Date.parse(a.status.lastRead)
    );
    const tempList = [];
    for (let i = 0; i < books.items.length; i++) {
      const book = books.items[i];
      const progress = (() => {
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
      })();
      tempList.push(
        <Bookdata
          title={book.attr.title}
          isbn={book.attr.isbn}
          pageCount={book.attr.totalPageCount}
          lastRead={Temporal.PlainDate.from(book.status.lastRead)}
          progress={progress}
        />
      );
    }
    setBookList(tempList);
  };
  return (
    <div className="Booklist" onLoad={() => fetchBook()}>
      <h2>最近読んだ本の一覧</h2>
      <button onClick={() => fetchBook()}>更新</button>
      <ul>{bookList}</ul>
    </div>
  );
}

export default Booklist;

