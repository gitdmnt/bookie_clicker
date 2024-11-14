import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useBookContext } from "../../../../hooks/bookContextHook";

export const Search = (props: { setStyle: any }) => {
  /*
  1. isbnを入力するための検索窓を表示する。
  2. isbnを入力すると書籍情報を取得する。
  3. isbnが正しくない場合は、検索窓を赤く表示する。
  4. isbnが正しい場合は、検索窓を白く表示する。
  5. 取得した書籍情報を親に渡す。
  */

  // isbn, title
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const { setBookInfoContainer } = useBookContext();

  // 検索窓を赤くするためのスタイル
  const [searchWindowStyle, setSearchWindowStyle] = useState({
    border: "none",
  });

  // 関数定義
  // ISBN入力窓を制御する
  const handleIsbnChange = (e: any) => {
    let i = e.target.value
      .replace(/\D/g, "")
      .match(/^((97)(8|9))?(\d{10})$/)?.[0];
    if (!i) {
      setSearchWindowStyle({ border: "1px solid red" });
      props.setStyle("start");
      return;
    }
    i = i.length === 13 ? i : `978${i}`;

    //calc check digit

    const sum = i
      .slice(0, 12)
      .split("")
      .reduce(
        (acc: number, c: string, i: number) =>
          acc + parseInt(c) * (i % 2 === 0 ? 1 : 3),
      0
    );
    const checkDigit = (10 - (sum % 10)) % 10;

    i = i.slice(0, 12) + String(checkDigit);

    setIsbn(i);
    setTitle("");
  };

  // タイトル検索窓を制御する
  const handleTitleChange = (e: any) => {
    setTitle(e.target.value);
    setIsbn("");
  };

  // バックエンドを叩く
  const loadBookInfo = async () => {
    if (!isbn && !title) {
      setBookInfoContainer([]);
      return;
    }

    const query: SruApiQuery = {
      operation: "searchRetrieve",
      query: isbn ? `isbn%3d${isbn}` : `title%3d${title}`,
      start_record: 1,
      maximum_records: 10,
      record_packing: "xml",
      record_schema: "dcndl",
    };

    invoke("get_book_info", { query }).then((b: any) => {
      const books: BookInfo[] = b;
      console.log(
        "book info:",
        books.map((book: BookInfo) => book.title)
      );
      setBookInfoContainer(b);
    });

    setSearchWindowStyle({ border: "none" });
  };

  return (
    <div className="Search">
      <input
        type="text"
        placeholder="タイトルを入力"
        style={searchWindowStyle}
        value={title}
        onChange={(e) => handleTitleChange(e)}
        disabled={!!isbn}
      />
      <input
        type="text"
        placeholder="ISBNを入力"
        style={searchWindowStyle}
        value={isbn}
        onChange={(e) => handleIsbnChange(e)}
        disabled={!!title}
      />
      <button onClick={loadBookInfo}>検索</button>
    </div>
  );
};

