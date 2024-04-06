import { css } from "@emotion/react";
import { color } from "./Color";

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

export const BookStatus = (props: any) => {
  const bookStatus = props.bookStatus;

  return (
    <div css={style.BookStatus}>
      <div className="title">
        <h3 className="title">{bookStatus?.attr.title}</h3>
        <div className="subtitle">{bookStatus?.attr.subtitle}</div>
      </div>
      <div className="authors">{bookStatus?.attr.authors.join()}</div>
      <div className="isbn">{bookStatus?.attr.isbn}</div>
      <div className="progressbar_wrapper">
        <div className="progressbar_container">
          <div
            className="progressbar"
            style={{ width: progress(bookStatus).toString() + "%" }}
          ></div>
        </div>
        <p className="percentage">{progress(bookStatus).toString() + "%"}</p>
      </div>
      <img className="cover" src={bookStatus?.attr.imageUrl}></img>

      <div className="progress_container">
        {bookStatus?.status.progresses.map((e: any) => (
          <div className="progress">
            <div className="term">
              {e.termStart} - {e.termEnd}
            </div>
            <div className="pages"></div>
            <div className="memo">{e.memo}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const style = {
  BookStatus: css`
    display: grid;
    grid-template-columns: auto 150px;
    grid-template-rows: 5rem auto 1rem 5rem auto;
    grid-gap: 1rem;
    width: 100%;
    overflow: scroll;
    & > .title {
      grid-area: 1/1/2/2;
      align-self: center;
      & > .title {
        margin: 0;
        font-size: 2rem;
        font-weight: bold;
      }
      & > .subtitle {
        margin: 0;
        font-size: 1.2rem;
        font-weight: bold;
      }
    }
    .authors {
      grid-area: 2/1/3/2;
      font-size: 0.8rem;
    }
    .isbn {
      grid-area: 3/1/4/2;
      font-size: 0.8rem;
    }
    .cover {
      grid-area: 1/2/5/3;
      width: 100%;
    }
    .progressbar_wrapper {
      grid-area: 4/1/5/2;
      .progressbar_container {
        margin: 0;
        height: 1rem;
        border-radius: 100rem;
        background-color: ${color.progressbar_bg};
        .progressbar {
          height: 100%;
          border-radius: 100rem;
          background-color: ${color.progressbar_bar};
        }
      }
      .percentage {
        font-size: 0.8rem;
      }
    }
    .progress_container {
      grid-area: 5/1/6/3;
    }
  `,
};

