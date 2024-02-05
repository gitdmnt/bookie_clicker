import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Temporal } from "temporal-polyfill";
import Toggle from "react-styled-toggle";

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
  /*
    async function debug(msg: string) {
        await invoke("debug_print", { msg });
    }
    */
  return (
    <div className="Register">
      <h2>登録</h2>
      <div className="Search">
        <h3>検索</h3>
        <form onSubmit={handleIsbnSubmit}>
          <input
            className="input"
            placeholder="ISBNを入力"
            name="isbn"
            type="text"
            autoComplete="off"
          />
          <button className="Search-button button" type="submit">
            検索
          </button>
        </form>
        <div
          className="BookAttribute"
          style={(() => {
            if (bookAttr.isbn === "") {
              return { display: "none" };
            }
          })()}
        >
          <h4>詳細</h4>
          <ul>
            <li>『{bookAttr.title + " " + bookAttr.subtitle}』</li>
            <li>{bookAttr.authors.map((author) => author + ", ")} 著</li>
            <li>{bookAttr.totalPageCount}ページ</li>
          </ul>
        </div>
      </div>
      <div
        className="InputActivity"
        style={(() => {
          if (bookAttr.isbn === "") {
            return { display: "none" };
          }
        })()}
      >
        <h3>アクティビティ</h3>
        {/* アクティビティを入力し、activityにセットする。 */}
        <Toggle
          labelLeft="複数日モード"
          checked={termMode}
          onChange={() => setTermMode(!termMode)}
        />
        <form onSubmit={handleActivitySubmit}>
          <div className="page">
            <h4>読んだページ</h4>
            <input
              className="page-input"
              placeholder="1"
              name="pageStart"
              type="text"
              autoComplete="off"
            />
            <span>ページから</span>
            <input
              className="page-input"
              placeholder={bookAttr?.totalPageCount.toString()}
              name="pageEnd"
              type="text"
              autoComplete="off"
            />
            <span>ページまで</span>
          </div>
          <div className="date">
            <h4>読んだ日</h4>
            <div
              className="SetTerm"
              style={(() => {
                if (!termMode) return { display: "none" };
              })()}
            >
              <DatePicker
                id="term-start"
                dateFormat="yyyy-MM-dd"
                selected={termStart}
                name="term-start"
                onChange={(d) => {
                  setTermStart(d);
                }}
              />
              から
              <DatePicker
                id="term-end"
                dateFormat="yyyy-MM-dd"
                selected={termEnd}
                name="term-end"
                onChange={(d) => {
                  setTermEnd(d);
                }}
              />
              まで
            </div>
            <div
              className="SetTermAtOnce"
              style={(() => {
                if (termMode) return { display: "none" };
              })()}
            >
              <DatePicker
                id="term-at-once"
                dateFormat="yyyy-MM-dd"
                selected={termStart}
                name="term-at-once"
                onChange={(d) => {
                  setTermStart(d);
                  setTermEnd(d);
                }}
              />
            </div>
          </div>
          <div className="memo">
            <h4>メモ</h4>
            <textarea name="memo"></textarea>
          </div>
          <div className="star">
            <h4>評価</h4>
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
              className="Register-button"
              type="submit"
              onClick={() => {
                setReadStatus("Read");
              }}
            >
              読んだ
            </button>
            <button
              className="Register-button"
              type="submit"
              onClick={() => {
                setReadStatus("Unread");
              }}
            >
              読みたい
            </button>
          </div>
        </form>
        {/*
                <div className='Activity'>
                    <ul>
                        <li>読了状態: {activity.readStatus}</li>
                        <li>{activity.pageRange[0]}ページから{activity.pageRange[1]}ページまで</li>
                        <li>{activity.term[0].toString()}から{activity.term[1].toString()}まで</li>
                        <li>コメント: {activity.memo}</li>
                    </ul>
                </div>
                    */}
      </div>
    </div>
  );
}

export default Register;

