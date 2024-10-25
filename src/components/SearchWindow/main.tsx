import { useEffect, useState } from "react";
import { Temporal } from "proposal-temporal";
import "./type.d.ts";
import { dummy } from "./dummydata.ts";
import { ToggleButton } from "@mui/material";
import { RangeSlider, RatingSlider } from "./slider.tsx";
import { invoke } from "@tauri-apps/api/core";
import { XMLParser } from "fast-xml-parser";

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
const errorBookInfo: BookInfo = {
  isbn: 0,
  title: "データが見つかりませんでした。",
  subtitle: "",
  authors: [],
  image_url: "",
  total_page_count: 0,
};

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
  const [bookInfo, setBookInfo]: [BookInfo, any] = useState(defaultBookInfo);
  // 読書状態
  const [activity, setActivity]: [Activity, any] = useState({
    isbn: 0,
    range: [0, 0],
    date: today,
    memo: "",
    rating: 0,
  });

  useEffect(() => {
    setBookInfo(defaultBookInfo);
  }, []);

  // データを送信する関数
  const sendData = () => {
    invoke("add_record", { bookInfo, activity }).then((s) => console.log(s));
    setBookInfo(defaultBookInfo);
    setActivity({ range: [0, 0], date: today, memo: "", rating: 0 });
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

  // NDL SRU APIを使って書籍情報を取得する関数
  const search = async (): Promise<any> => {
    const isbn_13 = isbn.length === 13 ? isbn : `978${isbn}`;
    const url_13 = `https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&recordSchema=dcndl&recordPacking=xml&query=isbn%3d${isbn_13}`;

    const parser = new XMLParser();

    console.log(`hitting NDL Search API: ${url_13}`);
    let data = await fetch(url_13);
    let json: any = parser.parse(await data.text());
    if (json.searchRetrieveResponse.records) {
      const records = json.searchRetrieveResponse.records;
      console.log(`data fetched!`);
      console.log(records);
      return records;
    }
    console.log(`data not found for ${isbn_13}, trying isbn-10`);

    const isbn_10 = isbn.length === 13 ? isbn.slice(3, -1) : isbn;
    const url_10 = `https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&recordSchema=dcndl&recordPacking=xml&query=isbn%3d${isbn_10}`;

    console.log(`hitting NDL Search API: ${url_10}`);
    data = await fetch(url_10);
    json = parser.parse(await data.text());
    if (json.searchRetrieveResponse.records) {
      const records = json.searchRetrieveResponse.records;
      console.log(`data fetched!`);
      console.log(records);
      return records;
    }
    console.log("data not found.");
    return {};
  };

  // APIから取得したデータを整形する関数
  const formatBookInfo = (data: any): BookInfo[] => {
    console.log(data);
    const records = Array.isArray(data.record) ? data.record : [data.record];
    const books = records.map((record: any) => {
      const resource = record.recordData["rdf:RDF"]["dcndl:BibResource"][0];
      console.log(resource);

      const isbn_13 = isbn.length === 13 ? isbn : `978${isbn}`;
      const title = resource["dc:title"]["rdf:Description"]["rdf:value"];
      const seriesTitle = resource["dcndl:seriesTitle"]
        ? resource["dcndl:seriesTitle"]["rdf:Description"]["rdf:value"]
        : "";
      const authors = Array.isArray(resource["dcterms:creator"])
        ? resource["dcterms:creator"].map((a: any) =>
            a["foaf:Agent"]["foaf:name"]
              .split(/,\s?/)
              .filter((n: string) => !/^\d{4}/.test(n))
              .join(" ")
          )
        : [
            resource["dcterms:creator"]["foaf:Agent"]["foaf:name"]
              .split(/,\s?/)
              .filter((n: string) => !/^\d{4}/.test(n))
              .join(" "),
          ];

      const book: BookInfo = {
        isbn: Number(isbn_13),
        title: title,
        subtitle: seriesTitle,
        authors: authors,
        image_url: `https://ndlsearch.ndl.go.jp/thumbnail/${isbn_13}.jpg`,
        total_page_count: Number(resource["dcterms:extent"].match(/^\d+/)[0]),
      };
      return book;
    });
    return books;
  };

  const loadBookInfo = async () => {
    if (isbn === "") {
      props.setBookInfo({ defaultBookInfo });
      return;
    }
    const data = await search();
    if (!data.record) {
      props.setBookInfo({ errorBookInfo });
      return;
    }
    const formattedData = formatBookInfo(data)[0];
    props.setBookInfo(formattedData);
    console.log("book info:", formattedData);
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

const BookInfo = (props: { bookInfo: BookInfo }) => {
  /*
    1. 書籍情報を表示する。
   */

  return (
    <div className="BookInfo">
      <div className="title">{props.bookInfo.title}</div>
      <div className="subtitle">{props.bookInfo.subtitle}</div>
      <div className="authors">{(props.bookInfo.authors ?? []).join(", ")}</div>
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

