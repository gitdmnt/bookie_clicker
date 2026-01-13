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
    <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{book?.title}</h1>
          <p className="text-sm text-neutral-500">
            {(book?.authors ?? []).join(" / ")} ・ {book?.publisher}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-sm text-blue-600"
            onClick={onClose}
          >
            閉じる
          </button>
          <button
            type="button"
            className="text-sm text-red-500"
            onClick={() => onDelete(book?.isbn ?? null)}
          >
            削除
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[auto,1fr]">
        {book?.imageUrl && (
          <img
            src={book.imageUrl}
            alt={book.title}
            className="h-40 w-full max-w-[160px] rounded-2xl object-cover"
          />
        )}
        <div className="flex flex-col gap-1 text-sm text-neutral-600">
          <p>{book?.seriesTitle}</p>
          <p>発行年: {book?.year ?? "年不明"}</p>
          <p>ページ数: {book?.pageCount ?? "-"}ページ</p>
          <p>ISBN: {book?.isbn}</p>
        </div>
      </div>
      <ReadingLogRegistrationForm
        isbn={book?.isbn}
        maxPage={book?.pageCount}
        setLapNoteLogs={setLapNoteLogs}
        lapNoteLogs={lapNoteLogs}
        loadLogs={loadLogs}
      />
      <ReadingLogCards logs={logs} reloadLogs={loadLogs} />
    </div>
  );
};

export default BookDetailPage;
