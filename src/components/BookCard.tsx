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

type prop = {
  book: Book;
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

function Bookdata(props: prop) {
  const persentage = progress(props.book);

  const style = {
    BookCard: css`
      margin: 0.5rem;
      width: 8rem;
      img {
        width: 8rem;
      }
      .progressbar_container {
        margin: 0;
        width: 100%;
        height: 0.2rem;
        background-color: ${color.progressbar_bg};
        .progressbar {
          width: ${persentage}%;
          height: 100%;
          background-color: ${color.progressbar_bar};
        }
      }
    `,
  };

  return (
    <li css={style.BookCard} id={props.book.attr.isbn}>
      <img src={props.book.attr.imageUrl} />
      <div className="progressbar_container">
        <div className="progressbar"></div>
      </div>
    </li>
  );
}

export default Bookdata;

