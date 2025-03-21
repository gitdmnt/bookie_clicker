import { useState, useEffect } from "react";
import "./type.d.ts";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { XMLParser } from "fast-xml-parser";
import bg from "./assets/bg.jpg";
import { Temporal } from "temporal-polyfill";

const Bookshelf = () => {
  const [books, setBooks]: [Book[], any] = useState([]);

  // Load books when component mounts and after adding new books
  const loadBooks = async () => {
    const query: Query = {
      elementType: "book",
    };
    invoke("select", { query }).then((result: any) => {
      let books = result.map((r: any) => r.book);
      setBooks(books);
    });
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // モーダルの表示・非表示、開閉時の状態更新

  const [isModalVisible, setIsModalVisible] = useState(false);
  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  useEffect(() => {
    loadBooks();
  }, [isModalVisible]);

  const AddBookModal = ({ onClose }: any) => {
    const [searchResults, setSearchResults] = useState<Book[]>([]);

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
        const records = Array.isArray(data.record)
          ? data.record
          : [data.record];
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
        elementType: "book",
        book: book,
      };
      console.log("add:", tableElement);
      await invoke("add", { e: tableElement });
      onClose();
    };

    return (
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
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
    );
  };

  // 本の詳細表示
  const [isBookDetailVisible, setIsBookDetailVisible] = useState(false);
  const [bookDetailsIndex, setBookDetailsIndex] = useState(0);
  const [displayBookLogs, setDisplayBookLogs] = useState<ReadingLog[]>();

  // バックエンドのDBから本を削除
  const handleDeleteBook = async (isbn: number | null | undefined) => {
    if (!isbn) return;
    await invoke("delete", {
      query: {
        elementType: "book",
        isbn: isbn,
      },
    });
    setIsBookDetailVisible(false);
    loadBooks();
  };

  // バックエンドのDBから本を全て削除
  const handleDeleteAllBooks = async () => {
    await invoke("delete", {
      query: {
        elementType: "book",
      },
    });
    loadBooks();
  };

  // バックエンドのDBから本の詳細を読み込み
  const handleShowBookDetail = async (isbn: number) => {
    console.log("Show book details for ISBN: ", isbn);

    // 例外処理; 記録にない本のISBNが指定された場合
    let book = books.find((b) => b.isbn === isbn);
    if (!book) {
      console.error("Book not found");
      return;
    }

    setIsBookDetailVisible(true);

    let num = books.indexOf(book);
    setBookDetailsIndex(num);

    await invoke("select", {
      query: { elementType: "readingLog", isbn: isbn },
    }).then((result: any) => {
      setDisplayBookLogs(result.map((r: any) => r.readingLog));
    });
  };

  const loadLogs = async () => {
    await invoke("select", {
      query: {
        elementType: "readingLog",
        isbn: books[bookDetailsIndex].isbn,
      },
    }).then((result: any) => {
      setDisplayBookLogs(result.map((r: any) => r.readingLog));
    });
  };

  // 記録登録フォーム
  const ReadingLogRegistrationForm = ({
    isbn,
    maxPage,
    loadLogs,
  }: {
    isbn: number;
    maxPage: number;
    loadLogs: () => void;
  }) => {
    const [activeCard, setActiveCard] = useState(0);
    const totalCards = 2;

    const nextCard = () => {
      setActiveCard((prev) => (prev + 1) % totalCards);
    };

    const prevCard = () => {
      setActiveCard((prev) => (prev - 1 + totalCards) % totalCards);
    };

    const [dateStart, setDateStart] = useState(Temporal.Now.plainDateISO());
    const [dateEnd, setDateEnd] = useState(Temporal.Now.plainDateISO());
    const [timeStart, setTimeStart] = useState(Temporal.Now.plainTimeISO());
    const [timeEnd, setTimeEnd] = useState(Temporal.Now.plainTimeISO());
    const [pageStart, setPageStart] = useState(1);
    const [pageEnd, setPageEnd] = useState(maxPage);
    const [note, setNote] = useState("");
    const [rating, setRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const readingLog: ReadingLog = {
        id: "",
        isbn: isbn,
        time: [
          dateStart.toString() + "T" + timeStart.toString(),
          dateEnd.toString() + "T" + timeEnd.toString(),
        ],
        page: [pageStart, pageEnd],
        note: note,
        rating: rating,
      };
      console.log(readingLog);
      await invoke("add", { e: { elementType: "readingLog", readingLog } });
      await loadLogs();
    };
    return (
      <div className="relative">
        <div className="relative">
          {/* カード */}
          <div className="m-4">
            <div
              className="flex gap-3 transition-transform duration-300 ease-in-out w-full"
              style={{
                transform: `translateX(calc(-${activeCard * 100}% - ${
                  activeCard * 0.75
                }rem))`,
              }}
            >
              <div className="p-4 card w-full flex-shrink-0 overflow-hidden">
                <p>記録</p>
                <form className="flex flex-wrap gap-4">
                  <div className="mb-4 flex justify-start items-center flex-wrap">
                    <label htmlFor="date" className="block mb-1"></label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-gray-400 border-2 box-content transition-colors"
                      value={dateStart.toString()}
                      onChange={(e) =>
                        setDateStart(Temporal.PlainDate.from(e.target.value))
                      }
                    />
                    <label htmlFor="time" className="block mb-1"></label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-gray-400 border-2 box-content transition-colors"
                      value={timeStart.toString({ smallestUnit: "minute" })}
                      onChange={(e) =>
                        setTimeStart(Temporal.PlainTime.from(e.target.value))
                      }
                    />
                    <div className="flex justify-start items-center flex-nowrap">
                      <p className="p-1">p.</p>
                      <label htmlFor="page" className="block mb-1"></label>
                      <input
                        type="number"
                        id="page"
                        name="page"
                        placeholder="1"
                        className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-gray-400 border-2 box-content transition-colors w-12"
                        value={pageStart}
                        onChange={(e) => setPageStart(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="mb-4 flex justify-start items-center flex-wrap">
                    <label htmlFor="date" className="block mb-1"></label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-gray-400 border-2 box-content transition-colors"
                      value={dateEnd.toString()}
                      onChange={(e) =>
                        setDateEnd(Temporal.PlainDate.from(e.target.value))
                      }
                    />
                    <label htmlFor="time" className="block mb-1"></label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-gray-400 border-2 box-content transition-colors"
                      value={timeEnd.toString({ smallestUnit: "minute" })}
                      onChange={(e) =>
                        setTimeEnd(Temporal.PlainTime.from(e.target.value))
                      }
                    />
                    <div className="flex justify-start items-center flex-nowrap">
                      <p className="p-1">p.</p>
                      <label htmlFor="page" className="block mb-1"></label>
                      <input
                        type="number"
                        id="page"
                        name="page"
                        placeholder="2"
                        className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-gray-400 border-2 box-content transition-colors w-12"
                        value={pageEnd}
                        onChange={(e) => setPageEnd(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-gray-400 border-2 box-content transition-colors"
                    placeholder="読んだこと"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  ></textarea>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-center items-center flex-wrap">
                    <button
                      type="submit"
                      className="bg-gray-600 text-white hover:bg-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                      onClick={(e) => handleSubmit(e)}
                    >
                      登録
                    </button>
                  </div>
                </form>
              </div>
              <div className="p-4 card w-full flex-shrink-0">
                <p>読む</p>
              </div>
            </div>
          </div>
          {/* 矢印ナビゲーション */}
          <div className="flex justify-between absolute top-1/2 left-0 right-0">
            <button
              onClick={prevCard}
              className="bg-white bg-opacity-70 rounded-full p-2 shadow-md hover:bg-opacity-80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextCard}
              className="bg-white bg-opacity-70 rounded-full p-2 shadow-md hover:bg-opacity-80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* インジケーター */}
        <div className="flex justify-center mt-2">
          {[...Array(totalCards)].map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className={`h-2 w-2 mx-1 rounded-full bg-white ${
                activeCard === index ? "" : "bg-opacity-70"
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  // 読書ログの表示
  const ReadingLogCards = ({ logs }: { logs: ReadingLog[] }) => {
    // ログを時間順にソート
    logs.sort((a, b) => {
      const aStart = Temporal.PlainDateTime.from(a.time[0]);
      const bStart = Temporal.PlainDateTime.from(b.time[0]);
      return aStart.since(bStart).total({ unit: "minute" });
    });

    const datetimes = logs.map((log: ReadingLog) => {
      const start = Temporal.PlainDateTime.from(log.time[0]);
      const end = Temporal.PlainDateTime.from(log.time[1]);
      const duration = Temporal.Duration.from(end.since(start));
      return [start, end, duration];
    });
    const years = datetimes.map((dt: any) => dt[0].year);
    const dates = datetimes.map((dt: any) => [dt[0].month, dt[0].day]);
    const durs = datetimes.map((dt: any) => dt[2].total({ unit: "minute" }));

    const logChunkByYear = (() => {
      const yearList = Array.from(new Set(years));
      return logs
        .map((log, i) => ({
          yearIndex: yearList.indexOf(years[i]),
          data: {
            id: log.id,
            date: dates[i],
            dur: durs[i],
            page: log.page,
            note: log.note,
            rating: log.rating,
          },
        }))
        .reduce((acc: any, cur: any) => {
          if (acc[cur.yearIndex] === undefined) {
            acc.push({
              year: yearList[cur.yearIndex],
              logs: [cur.data],
            });
          } else {
            acc[cur.yearIndex].logs.push(cur.data);
          }
          return acc;
        }, []);
    })();

    const deleteLog = (id: string) => {
      invoke("delete", { query: { elementType: "readingLog", id: id } });
      loadLogs();
    };

    return (
      <div className="m-4 card">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">読書記録</h3>
        <ul className="">
          {logChunkByYear.map((chunk: any, i: number) => (
            <li key={i} className="mb-4">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold text-blue-600">
                  {chunk.year}
                </h2>
              </div>

              <ul className="flex flex-col gap-1">
                {chunk.logs.map((log: any, j: number) => (
                  <li
                    key={j}
                    className="flex gap-1 justify-start hover:bg-blue-50 rounded transition-colors duration-150"
                  >
                    <div className="text-sm font-medium text-gray-400 px-2 rounded">
                      {`${log.date[0]}/${log.date[1]}`}
                    </div>
                    <div className="flex flex-col gap-1">
                      {log.note && <div>{log.note}</div>}
                      <div className="flex gap-1">
                        <div className="text-sm font-medium text-gray-400 rounded">
                          {Math.floor(log.dur / 24 / 60) > 0 &&
                            `${Math.floor(log.dur / 24 / 60)}日`}
                          {Math.floor((log.dur / 60) % 24) > 0 &&
                            `${Math.floor((log.dur / 60) % 24)}時間`}
                          {Math.floor(log.dur % 60) > 0 &&
                            `${Math.floor(log.dur % 60)}分`}
                          {Math.floor(log.dur) === 0 && "0分"}
                        </div>
                        <div className="text-sm font-medium text-gray-400 rounded">
                          {`${log.page[0]} ~ ${log.page[1]}ページ`}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => console.log(log.id)}>id</button>
                    <svg
                      className="w-6 h-6 ml-auto"
                      onClick={() => deleteLog(log.id)}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const BookDetailPage = ({ onClose, onDelete, book, logs }: any) => (
    <div className="absolute inset-0 z-10">
      <img className="fixed inset-0 object-cover w-full h-full" src={bg} />

      <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between p-4 z-20 bg-slate-100 rounded-b-lg">
          <button onClick={() => onClose(false)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button onClick={() => onDelete(book?.isbn)}>Delete</button>
        </div>
        {/* 本の情報 */}
        <div className="grid grid-cols-2 justify-center gap-4 m-4 card">
          <div>
            <img
              src={book?.imageUrl}
              alt="book cover"
              className="w-60 rounded-lg"
            />
          </div>
          <div className="flex flex-col justify-center gap-4">
            <h1 className="text-2xl font-bold">{book?.title}</h1>
            <p className="text-gray-400">{(book?.authors ?? []).join(", ")}</p>
            <p>{book?.publisher}</p>
            <p>{book?.year}</p>
            <p>{book?.pageCount}</p>
          </div>
        </div>
        {/* 読書記録登録フォーム */}
        <div className="z-20 bg-slate-100 rounded-t-lg shadow-lg">
          <ReadingLogRegistrationForm
            isbn={book?.isbn}
            maxPage={book?.pageCount}
            loadLogs={loadLogs}
          />

          {/* 読書記録一覧 */}
          <ReadingLogCards logs={logs ?? []} />
        </div>
      </div>
    </div>
  );

  // 本棚本体
  const BookshelfMain = (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={openModal}
        className="flex flex-col items-center justify-center md:h-48 md:w-32 h-36 w-24 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <span className="text-4xl mb-2">+</span>
        <span>Add Book</span>
      </button>

      {books.map((book?: Book) => (
        <button
          key={book?.isbn}
          onClick={() => handleShowBookDetail(book?.isbn ?? 0)}
          className="relative flex flex-col md:h-48 md:w-32 h-36 w-24 bg-white rounded-lg shadow overflow-hidden"
        >
          {book?.imageUrl && (
            <img
              src={book.imageUrl}
              alt={book.title}
              className="h-48 w-full object-cover box-border"
            />
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gray-700 bg-opacity-50 p-2">
            <h3 className="font-medium text-sm truncate text-white">
              {book?.title}
            </h3>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-4">
      {isModalVisible && <AddBookModal onClose={closeModal} />}
      {isBookDetailVisible && (
        <BookDetailPage
          onClose={setIsBookDetailVisible}
          onDelete={handleDeleteBook}
          book={books[bookDetailsIndex]}
          logs={displayBookLogs}
        />
      )}
      {BookshelfMain}
    </div>
  );
};

const Config = () => {};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Bookshelf />
    </div>
  );
}

export default App;
