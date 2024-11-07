import { useEffect, useState } from "react";
import { RangeSlider, RatingSlider } from "./slider.tsx";
import { ToggleButton } from "@mui/material";
import { Temporal } from "proposal-temporal";
import { useBookContext } from "../../bookContextHook.tsx";

const today = new Date().toISOString().slice(0, 10);
const defaultBookInfo: BookInfo = {
  isbn: 0,
  title: "",
  subtitle: "",
  authors: [],
  image_url: "",
  total_page_count: 0,
};

export const Activity = () => {
  /*
    1. 読書状態を入力する。
    2. 読書状態を構造体に詰めて親に渡す。
   */

  const { bookInfoContainer, bookInfoIndex, setActivity } = useBookContext();
  const bookInfo = bookInfoContainer[bookInfoIndex] ?? defaultBookInfo;

  const [range, setRange]: [number[], any] = useState([1, 1]);
  const [date, setDate]: [string, any] = useState(today);
  const [memo, setMemo]: [string, any] = useState("");
  const [rating, setrating]: [number, any] = useState(5);

  // 変更があったら親に渡す
  useEffect(() => {
    setActivity({
      isbn: bookInfo.isbn,
      range,
      date,
      memo,
      rating,
    });
  }, [range, date, memo, rating]);

  // 送信されたら初期化
  useEffect(() => {
    if (bookInfo.title === "") {
      setRange([1, 1]);
      setDate(today);
      setMemo("");
      setrating(5);
    }
  }, [bookInfo]);

  // 親の書籍情報が変わったらrangeを初期化
  useEffect(() => {
    setRange([1, bookInfo.total_page_count]);
  }, [bookInfo.total_page_count]);

  return (
    <div className="activity">
      <ToggleButton
        value="Read"
        selected={range[0] === 1 && range[1] === bookInfo.total_page_count}
        onChange={() =>
          range[0] === 1 && range[1] === bookInfo.total_page_count
            ? setRange([1, 1])
            : setRange([1, bookInfo.total_page_count])
        }
      >
        読了
      </ToggleButton>

      <div className="range">
        <span>読んだ範囲</span>
        <RangeSlider
          min={1}
          max={bookInfo.total_page_count}
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

