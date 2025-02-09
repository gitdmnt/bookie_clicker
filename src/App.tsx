import { useState } from "react";
import "type.d.ts";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  // 書庫
  const [books, setBooks]: [TableElement[], any] = useState([]);

  const query = async (q: Query) => {
    invoke("query", { query: q }).then((e) => setBooks(e));
  };
  const add = async (e: TableElement) => {};

  const bookshelf = books.map((book: TableElement, index) => (
    <li key={index} className="Book w-24 h-32 bg-slate-300">
      <img src={book.imageUrl} alt={book.title} />
      <h2>{book.title}</h2>
      <p>{book.authors.map((s: string) => `- ${s}`).join("\n")}</p>
    </li>
  ));

  const [isModalVisible, setIsModalVisible] = useState(false);
  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const Bookshelf = (
    <ul className="Bookshelf bg-slate-200 flex flex-wrap flex-row gap-4 p-4">
      <li
        id="AddBookButton"
        className="Book w-24 h-32 bg-slate-300"
        onClick={openModal}
      >
        <img alt="Add Book" />
        <h2>Add Book</h2>
      </li>
      {bookshelf}
    </ul>
  );

  const BookAddModal = isModalVisible ? (
    <div id="BookAdd" className="absolute">
      <div
        id="BookAddModalBG"
        className="bg-opacity-50 bg-slate-200 w-screen h-screen absolute"
        onClick={closeModal}
      ></div>

      <div id="BookAddModal" className="bg-white w-80 h-80 absolute"></div>
    </div>
  ) : (
    <></>
  );

  return (
    <>
      {BookAddModal}
      {Bookshelf}
    </>
  );
}

export default App;

