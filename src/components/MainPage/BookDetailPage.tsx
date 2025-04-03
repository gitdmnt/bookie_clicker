import bg from "@/assets/bg.jpg";
import ReadingLogRegistrationForm from "./ReadingLogRegistrationForm";
import ReadingLogCards from "./ReadingLogCards";
import useReadingLogs from "@/hooks/useReadingLogs";
import { deleteElements } from "@/utils/api";

const BookDetailPage = ({
  book,
  onClose,
  lapNoteLogs,
  setLapNoteLogs,
}: any) => {
  const { logs, loadLogs } = useReadingLogs(book.isbn);

  const onDelete = async (isbn: number | null) => {
    if (!isbn) return;
    await deleteElements({ elementType: "book", isbn });
    onClose();
  };

  return (
    <div className="absolute top-0 z-10 bg-slate-300 bg-opacity-80 backdrop-blur-sm w-full rounded-t-lg shadow-lg">
      <div className=" w-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-center p-2 z-20 bg-white bg-opacity-90 backdrop-blur-sm rounded-t-lg">
          <button onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-6"
              fill="none"
              viewBox="0 0 24 12"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 2l7 7 7 -7"
              />
            </svg>
          </button>
        </div>
        {/* Book Information */}
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
            <p className="text-gray-400">{book?.seriesTitle}</p>
            <p className="text-gray-400">{(book?.authors ?? []).join(", ")}</p>
            <p>{book?.publisher}</p>
            <p>{book?.year}</p>
            <p>{book?.pageCount}</p>
          </div>
        </div>
        {/* Reading Log Section */}
        <ReadingLogRegistrationForm
          isbn={book?.isbn}
          maxPage={book?.pageCount}
          setLapNoteLogs={setLapNoteLogs}
          lapNoteLogs={lapNoteLogs}
          loadLogs={loadLogs}
        />
        <ReadingLogCards logs={logs} reloadLogs={loadLogs} />
        <div className="h-16"></div>
      </div>
    </div>
  );
};

export default BookDetailPage;

