import { color } from "./Color";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Temporal } from "temporal-polyfill";
import Toggle from "react-styled-toggle";
import { css } from "@emotion/react";

import { invoke } from "@tauri-apps/api/tauri";

type attr = {
  isbn: string;
  title: string;
  subtitle: string;
  authors: string[];
  imageUrl: string;
  totalPageCount: number;
};

type activity = {
  readStatus: "Read" | "Unread";
  pageRange: number[];
  term: Temporal.PlainDate[];
  memo: string;
  star: number;
};

function Register() {
  const [bookAttr, setBookAttr] = useState<attr>({
    isbn: "",
    title: "",
    subtitle: "",
    authors: [""],
    imageUrl: "",
    totalPageCount: 0,
  });
  //   const [activity, setActivity] = useState<activity>({ readStatus: "Unread", pageRange: [0, 0], term: [Temporal.PlainDate.from("1970-01-01"), Temporal.PlainDate.from("1970-01-01")], memo: "" });

  const [readStatus, setReadStatus] = useState<"Read" | "Unread">("Read");
  const [termStart, setTermStart] = useState<Date | null>(new Date());
  const [termEnd, setTermEnd] = useState<Date | null>(new Date());
  const [termMode, setTermMode] = useState(false);

  const handleIsbnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      isbn: { value: string };
    };
    const isbn = target.isbn.value;
    if (isbn === "") {
      setBookAttr({
        isbn: "",
        title: "",
        subtitle: "",
        authors: [],
        imageUrl: "",
        totalPageCount: 0,
      });
    } else {
      setBookAttr(await invoke("set_book_attr", { isbn }));
    }
  };
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      pageStart: { value: string };
      pageEnd: { value: string };
      memo: { value: string };
      star: { value: number };
    };
    const pageRange = [
      Number(target.pageStart.value),
      Number(target.pageEnd.value),
    ];
    const term = [
      Temporal.PlainDate.from(
        (termStart ?? new Date()).toISOString().slice(0, 10)
      ),
      Temporal.PlainDate.from(
        (termEnd ?? new Date()).toISOString().slice(0, 10)
      ),
    ];
    const activity: activity = {
      readStatus: readStatus,
      pageRange: pageRange,
      term: term,
      memo: target.memo.value,
      star: Number(target.star.value),
    };
    //        setActivity(activity);
    await invoke("set_record", { bookAttr, activity });
  };

  return (
    <div css={style.container}>
      <div className="inputAttr">
        <div className="searchBook">
          <form onSubmit={handleIsbnSubmit}>
            <label htmlFor="isbn">ISBNから検索</label>
            <input
              placeholder="ISBNを入力"
              name="isbn"
              type="text"
              autoComplete="off"
            />
            <button type="submit">検索</button>
          </form>
        </div>

        <div className="showAttr" css={bookAttr.isbn === "" && style.none}>
          <ul>
            <li className="title">
              『
              {[bookAttr.title, bookAttr.subtitle]
                .filter((e) => e !== "")
                .join(" ")}
              』
            </li>
            <li className="author">著者: {bookAttr.authors.join(", ")}</li>
          </ul>
          <img src={bookAttr.imageUrl} />
        </div>
      </div>

      <div className="inputActivity">
        <h2>アクティビティ</h2>
        <form onSubmit={handleActivitySubmit}>
          <div className="inputPage">
            <h3>読んだページ</h3>
            <div className="input pageStart">
              <input
                className="pageInput"
                placeholder="1"
                name="pageStart"
                type="text"
                autoComplete="off"
              />
              <label htmlFor="pageStart">ページから</label>
            </div>
            <div className="input pageEnd">
              <input
                className="pageInput"
                placeholder={bookAttr?.totalPageCount.toString()}
                name="pageEnd"
                type="text"
                autoComplete="off"
              />
              <label htmlFor="pageEnd">ページまで</label>
            </div>
          </div>
          <div className="inputDate">
            <h3>読んだ日</h3>
            <Toggle
              labelLeft="日跨ぎモード"
              checked={termMode}
              onChange={() => setTermMode(!termMode)}
            />
            <div className="setTerm" css={!termMode && style.none}>
              <div className="input termStart">
                <DatePicker
                  id="termStart"
                  dateFormat="yyyy-MM-dd"
                  selected={termStart}
                  name="termStart"
                  onChange={(d) => {
                    setTermStart(d);
                  }}
                />
                <label htmlFor="termStart">から</label>
              </div>
              <div className="input termEnd">
                <DatePicker
                  id="termEnd"
                  dateFormat="yyyy-MM-dd"
                  selected={termEnd}
                  name="termEnd"
                  onChange={(d) => {
                    setTermEnd(d);
                  }}
                />
                <label htmlFor="termEnd">まで</label>
              </div>
            </div>
            <div className="setTermAtOnce" css={termMode && style.none}>
              <div className="input termAtOnce">
                <DatePicker
                  id="termAtOnce"
                  dateFormat="yyyy-MM-dd"
                  selected={termStart}
                  name="termAtOnce"
                  onChange={(d) => {
                    setTermStart(d);
                    setTermEnd(d);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="memo">
            <h3>メモ</h3>
            <textarea name="memo"></textarea>
          </div>
          <div className="star">
            <h3>評価</h3>
            <input
              type="range"
              name="star"
              min={1}
              max={5}
              step={1}
              defaultValue={5}
            ></input>
          </div>
          <div className="set-activity-button">
            <button
              className="button registerButton"
              type="submit"
              onClick={() => {
                setReadStatus("Read");
              }}
            >
              読んだ
            </button>
            <button
              className="button registerButton"
              type="submit"
              onClick={() => {
                setReadStatus("Unread");
              }}
            >
              読みたい
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;

const style = {
  none: css`
    display: none;
  `,
  container: css`
    .inputAttr {
      display: grid;
      grid-template-rows: auto auto;
      place-items: start center;

      margin: 2rem 2rem;

      .searchBook {
        justify-self: center;
        margin: 1rem;

        label {
          margin-inline-end: 1rem;
          padding: 0.2rem 0;
          font-size: 10pt;
          color: ${color.text_accent};
          border-block-end: 1px solid ${color.text_accent};
        }
        input {
          margin: 0;
          border-radius: 0.5rem 0 0 0.5rem;
        }
        button {
          margin: 0%;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      }
      .showAttr {
        display: grid;
        grid-template-columns: 1fr auto;

        margin: 1rem 0;

        width: 80%;
        border: 2px dashed ${color.border_primary};
        border-radius: 2rem;

        background-color: ${color.bg_component_active};

        ul {
          margin: 2rem 2rem;
          padding: 0;
          list-style: none;
          .title {
            font-size: 18pt;
          }
          .author {
            margin-inline-start: 1rem;
          }
        }
        img {
          margin: 1rem 0;
          padding: 1rem 2rem;
          border-inline-start: 2px dashed ${color.border_component};
        }
      }
    }

    .inputActivity {
      margin: 1rem;
    }
  `,
};

