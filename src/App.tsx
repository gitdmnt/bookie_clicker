import { useState, useEffect } from "react";
import "./type.d.ts";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { XMLParser } from "fast-xml-parser";

const BookShelf = () => {
  const [books, setBooks]: [Book[], any] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isBookDetailVisible, setIsBookDetailVisible] = useState(false);
  const [displayBookDetails, setDisplayBookDetails] = useState<Book>();
  const [displayBookLogs, setDisplayBookLogs] = useState<ReadingLog[]>();

  // Load books when component mounts and after adding new books
  const loadBooks = async () => {
    const query: Query = {
      elementType: {
        type: "Book",
        content: {},
      },
    };
    console.log(query);
    invoke("select", { query }).then((result: any) => {
      console.log(result[0]);
      let books = result.map((r: any) => r.content);
      setBooks(books);
    });
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // isbnからNDLサーチを用いて本を検索
  const searchBooks = async (isbn: string) => {
    let i = isbn.replace(/\D/g, "").match(/^((97)(8|9))?(\d{10})$/)?.[0];
    if (!i) {
      setSearchResults([]);
      return;
    }

    isbn = i;

    const fetchNDL = async (isbn: string) => {
      const isbn_13 = isbn.length === 13 ? isbn : `978${isbn}`;
      const url_13 = `https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&recordSchema=dcndl&recordPacking=xml&query=isbn%3d${isbn_13}`;

      const parser = new XMLParser();

      console.log(`hitting NDL Search API: ${url_13}`);
      let data = await fetch(url_13);
      let json: any = parser.parse(await data.text());
      if (json.searchRetrieveResponse.records) {
        const records = json.searchRetrieveResponse.records;
        console.log(`data fetched!`);
        // console.log(records);
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
        // console.log(records);
        return records;
      }
      console.log("data not found.");
      return {};
    };
    const records = await fetchNDL(isbn);
    const formatBookInfo = (data: any): Book[] => {
      console.log(data);
      const records = Array.isArray(data.record) ? data.record : [data.record];
      const books = records.map((record: any) => {
        const resource = record.recordData["rdf:RDF"]["dcndl:BibResource"][0];
        // console.log(resource);

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
        const publisher =
          resource["dcterms:publisher"]["foaf:Agent"]["foaf:name"];

        const year = resource["dcterms:issued"]
          ? typeof resource["dcterms:issued"] === "number"
            ? resource["dcterms:issued"]
            : Number(resource["dcterms:issued"].match(/^\d+/)[0])
          : undefined;

        const book: Book = {
          isbn: Number(isbn_13),
          title: title + seriesTitle,
          authors: authors,
          imageUrl: `https://ndlsearch.ndl.go.jp/thumbnail/${isbn_13}.jpg`,
          pageCount: Number(resource["dcterms:extent"].match(/^\d+/)[0]),
          publisher: publisher,
          year: year,
        };
        return book;
      });
      return books;
    };
    const books = formatBookInfo(records);
    setSearchResults(books);
  };

  // バックエンドのDBに本を追加
  const handleAddBook = async (book: Book) => {
    let tableElement = {
      type: "Book",
      content: book,
    };
    console.log(book);
    await invoke("add", { e: tableElement });
    loadBooks();
    closeModal();
  };

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const AddBookModal = isModalVisible ? (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={closeModal}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add New Book</h2>

        <input
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          placeholder="Search by ISBN"
          onChange={(e) => searchBooks(e.target.value)}
        ></input>
        <ul>
          {searchResults.map((book) => (
            <li key={book.isbn}>
              <button
                onClick={() => handleAddBook(book)}
                className="w-full hover:bg-slate-300"
              >
                <h3>{book.title}</h3>
                <p>{(book.authors ?? []).join(", ")}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : null;

  // バックエンドのDBから本を削除
  const handleDeleteBook = async (isbn: number | null | undefined) => {
    if (!isbn) return;
    await invoke("delete", {
      query: {
        elementType: {
          type: "Book",
          content: { isbn: isbn },
        },
      },
    });
    setIsBookDetailVisible(false);
    loadBooks();
  };

  // バックエンドのDBから本を全て削除
  const handleDeleteAllBooks = async () => {
    await invoke("delete", {
      query: {
        elementType: {
          type: "Book",
          content: {},
        },
      },
    });
    loadBooks();
  };

  const handleShowBookDetail = async (isbn: number) => {
    console.log("Show book details for ISBN: ", isbn);
    setIsBookDetailVisible(true);
    await invoke("select", {
      query: { elementType: { type: "Book", content: { isbn: isbn } } },
    }).then((result: any) => {
      setDisplayBookDetails(result[0].content);
    });
    await invoke("select", {
      query: { elementType: { type: "ReadingLog", content: { isbn: isbn } } },
    }).then((result: any) => {
      setDisplayBookLogs(result);
    });
  };

  const BookDetailPage = isBookDetailVisible ? (
    <div className="fixed inset-0 z-50 ">
      <div className="absolute inset-0 bg-white">
        <div className="flex justify-between p-4">
          <button onClick={() => setIsBookDetailVisible(false)}>Close</button>
          <button onClick={() => handleDeleteBook(displayBookDetails?.isbn)}>
            Delete
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div>
            <img
              src={displayBookDetails?.imageUrl}
              alt="book cover"
              className="w-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{displayBookDetails?.title}</h1>
            <p>{(displayBookDetails?.authors ?? []).join(", ")}</p>
            <p>{displayBookDetails?.publisher}</p>
            <p>{displayBookDetails?.year}</p>
            <p>{displayBookDetails?.pageCount}</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="p-4">
      {AddBookModal}
      {BookDetailPage}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={openModal}
          className="flex flex-col items-center justify-center h-48 w-32 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span className="text-4xl mb-2">+</span>
          <span>Add Book</span>
        </button>

        {books.map((book: Book) => (
          <button
            key={book.isbn}
            onClick={() => handleShowBookDetail(book.isbn)}
            className="relative flex flex-col h-48 w-32 bg-white rounded-lg shadow overflow-hidden"
          >
            {book.imageUrl && (
              <img
                src={book.imageUrl}
                alt={book.title}
                className="h-48 w-full object-cover box-border"
              />
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gray-700 bg-opacity-50 p-2">
              <h3 className="font-medium text-sm truncate text-white">
                {book.title}
              </h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BookShelf />
    </div>
  );
}

export default App;

