import { useEffect, useState } from "react";
import { Temporal } from "proposal-temporal";
import "./type.d.ts";
import { dummy } from "./dummydata.ts";
import { ToggleButton } from "@mui/material";
import { RangeSlider, StarSlider } from "./slider.tsx";
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

export const SearchWindow = () => {
  /*
    1. isbnを入力するための検索窓を表示する。
    2. isbnを入力すると、Google Books APIを使って書籍情報を取得する。
    3. 取得した書籍情報を表示する。
    4. 読書状態を入力する。
    5. その情報をバックエンドに送信する。
  */

  // 初期化
  // 書籍情報
  const [bookInfo, setBookInfo]: [BookInfo, any] = useState({
    isbn: 0,
    title: "",
    subtitle: "",
    authors: [],
    image_url: "",
    total_page_count: 1,
  });
  // 読書状態
  const [activity, setActivity]: [Activity, any] = useState({
    isbn: 0,
    range: [0, 0],
    date: "2021-01-01",
    memo: "",
    star: 0,
  });

  // データを送信する関数
  const sendData = () => {
    invoke("add_record", { bookInfo, activity }).then((s) => console.log(s));
    setBookInfo({
      isbn: 0,
      title: "",
      subtitle: "",
      authors: [],
      image_url: "",
      total_page_count: 1,
    });
    setActivity({ range: [0, 0], date: "2021-01-01", memo: "", star: 0 });
  };

  return (
    <div className="SearchWindow">
      <div className="search h-screen bg-gray-50 grid place-items-center">
        <Search setBookInfo={(v: BookInfo) => setBookInfo(v)} />
      </div>
      <div className="sendData grid place-items-center">
        <div className="bookInfo h-50 bg-gray-50">
          <BookInfo bookInfo={bookInfo} />
        </div>
        <div className="activity h-50 bg-gray-50">
          <Activity bookInfo={bookInfo} setActivity={setActivity} />
        </div>
        <div className="sendData grid place-items-center">
          <button onClick={sendData}>データを送信</button>
        </div>
      </div>
    </div>
  );
};

const Search = (props: { setBookInfo: any }) => {
  /*
  1. isbnを入力するための検索窓を表示する。
  2. isbnを入力すると、Google Books APIを使って書籍情報を取得する。
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
  // isbnが正しいかどうかを判定する関数
  const validateIsbn = (isbn: string): boolean => {
    const validatedIsbn = isbn
      .replace(/\D/g, "")
      .match(/^((97)(8|9))?(\d{10})$/)?.[0];
    if (!validatedIsbn) {
      return false;
    } else {
      return true;
    }
  };

  // Google Books APIを使って書籍情報を取得する関数
  const search = async (): Promise<any> => {
    const validatedIsbn = isbn
      .replace(/\D/g, "")
      .match(/^((97)(8|9))?(\d{10})$/)?.[0];
    console.log(
      `hitting google books apis: https://www.googleapis.com/books/v1/volumes?q=isbn:${validatedIsbn}`
    );
    const data = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${validatedIsbn}`
    );
    const json: any = await data.json();
    console.log(`data fetched! total items: ${json.totalItems}`);
    return json;
  };

  // Google Books APIから取得したデータを整形する関数
  const formatBookInfo = (data: any): BookInfo => {
    const volumeInfo = data.items[0].volumeInfo;
    const bookInfo: BookInfo = {
      isbn: Number(
        isbn.replace(/\D/g, "").match(/^((97)(8|9))?(\d{10})$/)?.[0]
      ),
      title: volumeInfo.title,
      subtitle: volumeInfo.subtitle,
      authors: volumeInfo.authors,
      image_url: volumeInfo.imageLinks ?? "",
      total_page_count: volumeInfo.pageCount,
    };
    return bookInfo;
  };

  const loadBookInfo = async () => {
    if (validateIsbn(isbn)) {
      setSearchWindowStyle({ backgroundColor: "white" });
      // const data = await search();
      const data = dummy;
      const formattedData = formatBookInfo(data);
      props.setBookInfo(formattedData);
      console.log(`book info: ${formattedData.image_url}`);
    } else if (isbn !== "") {
      setSearchWindowStyle({ backgroundColor: "red" });
    } else {
      setSearchWindowStyle({ backgroundColor: "white" });
    }
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
        onChange={(e) => setIsbn(e.target.value)}
      />
      <button onClick={loadBookInfo}>検索</button>
    </div>
  );
};

const BookInfo = (props: { bookInfo: BookInfo }) => {
  /*
    1. 書籍情報を表示する。
   */

  return (
    <div className="BookInfo">
      <div className="title">{props.bookInfo.title}</div>
      <div className="subtitle">{props.bookInfo.subtitle}</div>
      <div className="authors">{props.bookInfo.authors.join(", ")}</div>
      <div className="image_url">
        <img src={props.bookInfo.image_url ?? ""} alt="book cover" />
      </div>
      <div className="total_page_count">{props.bookInfo.total_page_count}</div>
    </div>
  );
};

const Activity = (props: { bookInfo: BookInfo; setActivity: any }) => {
  /*
    1. 読書状態を入力する。
    2. 読書状態を構造体に詰めて親に渡す。
   */

  const [range, setRange]: [number[], any] = useState([1, 1]);
  const [date, setDate]: [string, any] = useState("2021-01-01");
  const [memo, setMemo]: [string, any] = useState("");
  const [star, setStar]: [number, any] = useState(0);

  // 変更があったら親に渡す
  useEffect(() => {
    props.setActivity({
      isbn: props.bookInfo.isbn,
      range,
      date,
      memo,
      star,
    });
  }, [range, date, memo, star]);

  // 送信されたら初期化
  useEffect(() => {
    if (props.bookInfo.title === "") {
      setRange([1, 1]);
      setDate("2021-01-01");
      setMemo("");
      setStar(0);
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
        <span>読書期間</span>
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
      <StarSlider min={1} max={5} value={star} onChange={setStar} />
      <p>
        {range.join(",")}/{date.toString()}/{memo}/{star}
      </p>
    </div>
  );
};

