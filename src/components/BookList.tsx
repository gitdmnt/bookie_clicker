import { invoke } from "@tauri-apps/api";
import { useState, useEffect } from "react";
import { css } from "@emotion/react";
import { color } from "./Color";
import { BookStatus } from "./BookStatus";

// displayStatusをいじって、本のタイトルをクリックするとその本に関する情報が右側にばっと出てくるようにする

const progress = (book: Book | null) => {
  if (!book) {
    return 0;
  }
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
  const defaultBookList: Book[] = [];
  const [bookList, setBookList] = useState(defaultBookList);
  const [bookStatus, setBookStatus] = useState<Book | null>(null);
  const refreshList = async () => {
    const tempList: Book[] = [];
    const books: Books = await invoke("fetch_new");
    for (let i = 0; i < books.items.length; i++) {
      const book = books.items[i];
      tempList.push(book);
    }
    setBookList(tempList);
    setBookStatus(tempList[0]);
  };
  const displayStatus = (i: number) => {
    // タイトルをクリックしたらその作品のカードが開くようにしたいなあと思う
    // もしかしたらbookcard使わないかも
    setBookStatus(bookList[i]);
  };
  useEffect(() => {
    refreshList();
  }, []);

  return (
    <div css={style.BookList}>
      <div className="title_list">
        <div className="container search_container">
          <div className="search">検索</div>
        </div>
        <ul>
          {bookList.map((e, i) => (
            <li className="container" onClick={() => displayStatus(i)}>
              <div className="title">{e.attr.title}</div>
              <div className="progressbar_container">
                <div
                  className="progressbar"
                  style={{ width: progress(e).toString() + "%" }}
                ></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <BookStatus bookStatus={bookStatus} />
    </div>
  );
}

export default Booklist;

const style = {
  BookList: css`
    height: 100dvh;
    display: flex;
    place-items: start start;
    .title_list {
      height: 100dvh;
      width: 100%;
      background-color: ${color.bg_secondary};
      overflow: scroll;
      resize: horizontal;
      .container {
        margin: 0.4rem auto;
        border-radius: 0.4rem;
        height: auto;
        width: 90%;
        white-space: nowrap;
        overflow: scroll;
        &:hover {
          background-color: ${color.bg_component_active};
        }
        .search {
          margin: 0.4rem auto;
          width: 90%;
        }
        .title {
          margin: 0.2rem 0.4rem;
        }
        .progressbar_container {
          margin: 0;
          height: 0.2rem;
          width: 100%;
          background-color: ${color.progressbar_bg};
          .progressbar {
            height: 100%;
            background-color: ${color.progressbar_bar_secondary};
          }
        }
      }
      .search_container {
        background-color: ${color.bg_component};
      }
    }
  `,
};

