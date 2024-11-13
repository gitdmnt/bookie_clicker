import { useEffect, useState } from "react";
import { SearchWindow } from "./SearchWindow/main.tsx";
import { Slider } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import "./type.d.ts";
import "./main.css";

const today = new Date().toISOString().slice(0, 10);

export const Bookshelf = () => {
  const [query, setQuery] = useState<Query | null>(null);
  const [books, setBooks] = useState<Container[]>([]);

  useEffect(() => {
    if (query) {
      invoke("get_records", { query }).then((b: any) => {
        setBooks(b);
      });
    }
  }, [query]);

  const [isModalOpen, toggleAddItemModal] = useState(false);
  const renderModal = () => {
    if (isModalOpen) {
      return (
        <div className="modal">
          <div className="modalContent">
            <SearchWindow />
          </div>
          <div
            className="modalBG"
            onClick={() => toggleAddItemModal(false)}
          ></div>
        </div>
      );
    }
  };

  return (
    <div className="bookshelfContainer">
      <QueryForm setQuery={setQuery} />
      <ul className="bookshelf">
        <li
          key="inputNewBook"
          className="bookshelfItem addItem"
          onClick={() => toggleAddItemModal(true)}
        >
          本を追加する
        </li>
        {books.map((book: Container) => {
          return (
            <li key={book.book.isbn} className="bookshelfItem book">
              <img src={book.book.image_url} alt={book.book.title} />
              <div>
                <h2>{book.book.title}</h2>
                <h3>{book.book.subtitle}</h3>
                <p>{book.book.authors.join(", ")}</p>
                <p>{book.book.total_page_count}ページ</p>
              </div>
              <div>
                {book.diaries.map((diary: Activity) => {
                  return (
                    <div key={diary.date} className="Diary">
                      <p>{diary.date}</p>
                      <p>{diary.memo}</p>
                      <p>{diary.rating}</p>
                      <p>{diary.range.join(" - ")}</p>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {renderModal()}
    </div>
  );
};

const QueryForm = (props: { setQuery: any }) => {
  const [term, setTerm]: [[string, string], any] = useState([
    "2021-01-01",
    today,
  ]);
  const [rating, setRating]: [[number, number], any] = useState([1, 5]);
  const [order, setOrder]: ["Asc" | "Desc", any] = useState("Asc");
  const [key, setKey]: ["Title" | "Rating" | "Date" | "Page", any] =
    useState("Date");

  useEffect(() => {
    const query: Query = { term, rating, order, key };
    console.log("query", query);
    props.setQuery(query);
  }, [term, rating, order, key]);

  return (
    <div>
      <input
        type="date"
        value={term[0]}
        onChange={(e) => setTerm([e.target.value, term[1]])}
      />
      <input
        type="date"
        value={term[1]}
        onChange={(e) => setTerm([term[0], e.target.value])}
      />
      <StarRangeSlider value={rating} onChange={setRating} />
      <select
        className="Order"
        onChange={(e) => setOrder(e.target.value)}
        value={order}
      >
        <option value="Desc">Desc</option>
        <option value="Asc">Asc</option>
      </select>
      <select
        className="Key"
        onChange={(e) => setKey(e.target.value)}
        value={key}
      >
        <option value="Title">Title</option>
        <option value="Rating">Rating</option>
        <option value="Date">Date</option>
        <option value="Page">Page</option>
      </select>
    </div>
  );
};

const StarRangeSlider = (props: any) => {
  const { value, onChange } = props;
  return (
    <div className="Slider">
      <input
        type="number"
        value={value[0]}
        onChange={(e) => onChange([e.target.value, value[1]])}
        min={1}
        max={5}
      />
      <Slider
        getAriaLabel={() => "Rating"}
        value={value}
        onChange={(_, v) => onChange(v as number[])}
        valueLabelDisplay="auto"
        max={5}
        min={1}
        step={1}
      />
      <input
        type="number"
        value={value[1]}
        onChange={(e) => onChange([value[0], e.target.value])}
        min={1}
        max={5}
      />
    </div>
  );
};

