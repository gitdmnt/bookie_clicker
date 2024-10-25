import { useEffect, useState } from "react";
import { Slider } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import "./type.d.ts";

export const Bookshelf = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [term, setTerm]: [[string, string], any] = useState([today, today]);
  const [rating, setRating]: [[number, number], any] = useState([1, 5]);
  const [order, setOrder]: ["Asc" | "Desc", any] = useState("Asc");
  const [key, setKey]: ["Title" | "Rating" | "Date" | "Page", any] =
    useState("Date");

  const [books, setBooks]: [Container[], any] = useState([]);

  useEffect(() => {
    console.log(term);
    console.log(rating);
    const query: Query = { term, rating, order, key };
    invoke("get_records", { query }).then((books) => {
      console.log("books", books);
      setBooks(books);
    });
  }, [term, rating, order, key]);

  return (
    <div className="Bookshelf">
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
      <select className="Order" onChange={setOrder}>
        <option value="Desc">Desc</option>
        <option value="Asc">Asc</option>
      </select>
      <select className="Key" onChange={setKey}>
        <option value="Title">Title</option>
        <option value="Rating">Rating</option>
        <option value="Date">Date</option>
        <option value="Page">Page</option>
      </select>
      {books.map((book: Container) => {
        return (
          <div key={book.book.isbn} className="Book">
            <img src={book.book.image_url} alt={book.book.title} />
            <div className="Info">
              <h2>{book.book.title}</h2>
              <h3>{book.book.subtitle}</h3>
              <p>{book.book.authors.join(", ")}</p>
              <p>{book.book.total_page_count}ページ</p>
            </div>
            <div className="Diaries">
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
          </div>
        );
      })}
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

