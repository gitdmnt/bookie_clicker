import { useEffect } from "react";

import { invoke } from "@tauri-apps/api/core";

import { componentStyle } from "./styles.ts";
import { useBookContext } from "../../bookContextHook.tsx";
import { Search } from "./search";
import { ShowBookInfo } from "./showbookinfo";
import { Activity } from "./activity";
import "./type.d.ts";
import { usePageContext } from "../../pageContextHook.tsx";

// バックエンドに書き込むコンポーネント

const today = new Date().toISOString().slice(0, 10);

export const SearchWindow = () => {
  /*
    1. isbnを入力するための検索窓を表示する。
    2. isbnを入力すると、バックグラウンドAPIを叩いて書籍情報を取得する。
    3. 取得した書籍情報を表示する。
    4. 読書状態を入力する。
    5. その情報をバックエンドに送信する。
  */

  const { style, setStyle } = usePageContext();

  // 初期化
  // 書籍情報
  const {
    bookInfoContainer,
    setBookInfoContainer,
    bookInfoIndex,
    setBookInfoIndex,
    activity,
    setActivity,
  } = useBookContext();

  // データを送信する関数
  const sendData = async () => {
    console.log("sending data...");
    invoke("add_record", {
      bookInfo: bookInfoContainer[bookInfoIndex],
      activity,
    }).then((s) => console.log(s));
    setBookInfoContainer([]);
    setActivity({ range: [0, 0], date: today, memo: "", rating: 0 });
    setBookInfoIndex(-1);
  };

  useEffect(() => {
    if (bookInfoContainer.length > 0) {
      setStyle("default");
    } else {
      setStyle("start");
    }
  }, [bookInfoContainer]);

  return (
    <div className="SearchWindow">
      <div
        className="beforeSearch grid place-items-center"
        style={componentStyle.beforeSearch[style]}
      >
        <Search setStyle={setStyle} />
      </div>
      <div
        className="afterSearch place-items-center"
        style={componentStyle.afterSearch[style]}
      >
        <div className="bookInfo">
          <ShowBookInfo />
        </div>
        <div className="activity">
          <Activity />
        </div>
        <div className="sendData grid place-items-center">
          <button onClick={sendData}>データを送信</button>
        </div>
      </div>
    </div>
  );
};

