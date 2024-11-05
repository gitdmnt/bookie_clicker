import { useEffect, useState } from "react";
import { Temporal } from "proposal-temporal";
import "./type.d.ts";
import { ToggleButton } from "@mui/material";
import { RangeSlider, RatingSlider } from "./slider.tsx";
import { invoke } from "@tauri-apps/api/core";

/*
  isbnを入力すると、Google Books APIを使って書籍情報を取得し、表示するコンポーネント。
  ただし、isbnの入力が正しくない場合は、赤く表示する。
  また、isbnの入力が正しくない場合は、検索ボタンを押しても検索しない。
  isbnの入力が正しい場合は、検索ボタンを押すと、Google Books APIを使って書籍情報を取得する。

  1. stateとしてisbnを受け取る。
  2. isbnが変わったとき、useEffectでisbnが正しいかどうかを判定する。
  3. isbnが正しい場合は、Google Books APIを使って書籍情報を取得する。
  4. isbnが正しくない場合は、赤く表示する。

  次はここから
  5. 取得した書籍情報をbookInfoとしてstateに保存する。
  6. bookInfoを表示する。
  7. 読み進めたページ数などを入力する。
  8. その情報をバックエンドに送信する。
*/

const today = new Date().toISOString().slice(0, 10);
const defaultBookInfo: BookInfo = {
  isbn: 0,
  title: "",
  subtitle: "",
  authors: [],
  image_url: "",
  total_page_count: 0,
};
const defaultActivity: Activity = {
  isbn: 0,
  range: [0, 0],
  date: today,
  memo: "",
  rating: 0,
};

export const SearchWindow = () => {
  /*
    1. isbnを入力するための検索窓を表示する。
    2. isbnを入力すると、NDL Search APIを使って書籍情報を取得する。
    3. 取得した書籍情報を表示する。
    4. 読書状態を入力する。
    5. その情報をバックエンドに送信する。
  */

  // 初期化
  // 書籍情報
  const [bookInfoContainer, setBookInfoContainer]: [BookInfo[], any] = useState(
    []
  );
  const [bookInfoIndex, setBookInfoIndex] = useState(0);
  // 読書状態
  const [activity, setActivity]: [Activity, any] = useState(defaultActivity);

  // ページのスタイル
  const [afterSearchStyleIndex, setAfterSearchStyleIndex] = useState(1);
  const afterSearchStyle = [{ display: "none" }, { display: "block" }][
    afterSearchStyleIndex
  ];

  // データを送信する関数
  const sendData = async () => {
    invoke("add_record", { bookInfoContainer, activity }).then((s) =>
      console.log(s)
    );
    setBookInfoContainer([]);
    setActivity({ range: [0, 0], date: today, memo: "", rating: 0 });
  };

  useEffect(() => {
    if (bookInfoContainer.length > 0) {
      setAfterSearchStyleIndex(1);
    } else {
      setAfterSearchStyleIndex(0);
    }
  }, [bookInfoContainer]);

  return (
    <div className="SearchWindow">
      <div className="search bg-gray-50 grid place-items-center">
        <Search setBookInfoContainer={setBookInfoContainer} />
      </div>
      <div className="afterSearch place-items-center" style={afterSearchStyle}>
        <div className="bookInfo h-50 bg-gray-50">
          <BookInfo
            bookInfoContainer={bookInfoContainer}
            setIndex={setBookInfoIndex}
          />
        </div>
        <div className="activity h-50 bg-gray-50">
          <Activity
            bookInfo={bookInfoContainer[bookInfoIndex] ?? defaultBookInfo}
            setActivity={setActivity}
          />
        </div>
        <div className="sendData grid place-items-center">
          <button onClick={sendData}>データを送信</button>
        </div>
      </div>
    </div>
  );
};

const Search = (props: { setBookInfoContainer: any }) => {
  /*
  1. isbnを入力するための検索窓を表示する。
  2. isbnを入力すると、NDL Search APIを使って書籍情報を取得する。
  3. isbnが正しくない場合は、検索窓を赤く表示する。
  4. isbnが正しい場合は、検索窓を白く表示する。
  5. 取得した書籍情報を親に渡す。
*/

  // isbn
  const [isbn, setIsbn]: [string, any] = useState("");

  // 検索窓を赤くするためのスタイル
  const [searchWindowStyle, setSearchWindowStyle] = useState({
    backgroundColor: "white",
  });

  // 関数定義
  //
  const handleIsbnChange = (e: any) => {
    let i = e.target.value
      .replace(/\D/g, "")
      .match(/^((97)(8|9))?(\d{10})$/)?.[0];
    if (!i) {
      setSearchWindowStyle({ backgroundColor: "red" });
      return;
    }
    i = i.length === 13 ? i : `978${i}`;
    setIsbn(i);
    setSearchWindowStyle({ backgroundColor: "white" });
  };

  const loadBookInfo = async () => {
    if (isbn === "") {
      props.setBookInfoContainer([defaultBookInfo]);
      return;
    }

    invoke("get_book_info", { isbn }).then((b: any) => {
      const books: BookInfo[] = b;
      console.log(
        "book info:",
        books.map((book: BookInfo) => book.title)
      );
      props.setBookInfoContainer(b);
    });
  };

  useEffect(() => {
    loadBookInfo();
  }, [isbn]);

  return (
    <div className="Search">
      <input
        type="text"
        placeholder="ISBNを入力"
        style={searchWindowStyle}
        onChange={(e) => handleIsbnChange(e)}
      />
      <button onClick={loadBookInfo}>検索</button>
    </div>
  );
};

const BookInfo = (props: { bookInfoContainer: BookInfo[]; setIndex: any }) => {
  /*
    1. 書籍情報を表示する。
   */

  const bookInfoItems = props.bookInfoContainer.map(
    (bookInfo: BookInfo, index: number) => (
      <div className="BookInfo" onClick={() => props.setIndex(index)}>
        <div className="title">{bookInfo.title}</div>
        <div className="subtitle">{bookInfo.subtitle}</div>
        <div className="authors">{(bookInfo.authors ?? []).join(", ")}</div>
        <div className="image_url">
          <img src={bookInfo.image_url ?? ""} alt="book cover" />
        </div>
        <div className="total_page_count">{bookInfo.total_page_count}</div>
      </div>
    )
  );

  return <div className="BookInfoContainer">{bookInfoItems}</div>;
};

const Activity = (props: { bookInfo: BookInfo; setActivity: any }) => {
  /*
    1. 読書状態を入力する。
    2. 読書状態を構造体に詰めて親に渡す。
   */

  const [range, setRange]: [number[], any] = useState([1, 1]);
  const [date, setDate]: [string, any] = useState(today);
  const [memo, setMemo]: [string, any] = useState("");
  const [rating, setrating]: [number, any] = useState(5);

  // 変更があったら親に渡す
  useEffect(() => {
    props.setActivity({
      isbn: props.bookInfo.isbn,
      range,
      date,
      memo,
      rating,
    });
  }, [range, date, memo, rating]);

  // 送信されたら初期化
  useEffect(() => {
    if (props.bookInfo.title === "") {
      setRange([1, 1]);
      setDate(today);
      setMemo("");
      setrating(5);
    }
  }, [props.bookInfo]);

  // 親の書籍情報が変わったらrangeを初期化
  useEffect(() => {
    setRange([1, props.bookInfo.total_page_count]);
  }, [props.bookInfo.total_page_count]);

  return (
    <div className="activity">
      <ToggleButton
        value="Read"
        selected={
          range[0] === 1 && range[1] === props.bookInfo.total_page_count
        }
        onChange={() =>
          range[0] === 1 && range[1] === props.bookInfo.total_page_count
            ? setRange([1, 1])
            : setRange([1, props.bookInfo.total_page_count])
        }
      >
        読了
      </ToggleButton>

      <div className="range">
        <span>読んだ範囲</span>
        <RangeSlider
          min={1}
          max={props.bookInfo.total_page_count}
          value={range}
          onChange={setRange}
        />
      </div>
      <div className="date">
        <span>読んだ日</span>
        <input
          type="date"
          value={date.toString()}
          onChange={(e) =>
            setDate(Temporal.PlainDate.from(e.target.value).toString())
          }
        />
      </div>

      <div className="memo">
        <span>メモ</span>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
      <RatingSlider min={1} max={5} value={rating} onChange={setrating} />
    </div>
  );
};

