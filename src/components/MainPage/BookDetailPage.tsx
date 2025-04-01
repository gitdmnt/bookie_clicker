import bg from "@/assets/bg.jpg";
import ReadingLogRegistrationForm from "./ReadingLogRegistrationForm";
import ReadingLogCards from "./ReadingLogCards";
import useReadingLogs from "@/hooks/useReadingLogs";
import { deleteElements } from "@/utils/api";

const BookDetailPage = ({ book, onClose }: any) => {
  const { logs, loadLogs } = useReadingLogs(book.isbn);

  const onDelete = async (isbn: number | null) => {
    if (!isbn) return;
    await deleteElements({ elementType: "book", isbn });
    onClose();
  };
  return (
    <div className="absolute inset-0 z-10 bg-white bg-opacity-80 backdrop-blur-sm">
      <div className=" w-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between p-4 z-20 bg-slate-100 rounded-b-lg">
          <button onClick={onClose}>
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
        <div className="z-20 bg-slate-100 rounded-t-lg shadow-lg">
          <ReadingLogRegistrationForm
            isbn={book?.isbn}
            maxPage={book?.pageCount}
            loadLogs={loadLogs}
          />
          <ReadingLogCards logs={logs} reloadLogs={loadLogs} />
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
