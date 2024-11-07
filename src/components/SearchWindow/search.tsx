import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useBookContext } from "../../bookContextHook";

export const Search = (props: { setStyle: any }) => {
  /*
  1. isbnを入力するための検索窓を表示する。
  2. isbnを入力すると書籍情報を取得する。
  3. isbnが正しくない場合は、検索窓を赤く表示する。
  4. isbnが正しい場合は、検索窓を白く表示する。
  5. 取得した書籍情報を親に渡す。
*/

  // isbn
  const [isbn, setIsbn]: [string, any] = useState("");
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
  };

  // バックエンドを叩く
  const loadBookInfo = async () => {
    if (isbn === "") {
      setBookInfoContainer([]);
      return;
    }
    invoke("get_book_info", { isbn }).then((b: any) => {
      const books: BookInfo[] = b;
      console.log(
        "book info:",
        books.map((book: BookInfo) => book.title)
      );
      setBookInfoContainer(b);
    });

    setSearchWindowStyle({ border: "none" });
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

