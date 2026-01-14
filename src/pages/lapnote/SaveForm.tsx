export const SaveForm = ({
  states: { firstPage, lastPage, rating },
  handlers: {
    handleFirstPageChange,
    handleLastPageChange,
    setRating,
    handleSave,
  },
  book,
}: {
  states: {
    firstPage: number;
    lastPage: number;
    rating: number;
  };
  handlers: {
    handleFirstPageChange: (value: number) => void;
    handleLastPageChange: (value: number) => void;
    setRating: (value: number) => void;
    handleSave: (
      book: Book | null,
      firstPage: number,
      lastPage: number,
      rating: number
    ) => Promise<void>;
  };
  book: Book | null;
}) => {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-600">開始ページ</label>
      <input
        type="number"
        className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
        value={firstPage}
        min={1}
        onChange={(e) => handleFirstPageChange(Number(e.target.value) || 1)}
      />
      <label className="text-sm font-semibold text-gray-600">終了ページ</label>
      <input
        type="number"
        className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
        value={lastPage}
        min={firstPage}
        onChange={(e) =>
          handleLastPageChange(Number(e.target.value) || firstPage)
        }
      />
      <label className="text-sm font-semibold text-gray-600">評価 (1-5)</label>
      <input
        type="number"
        className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
        value={rating}
        min={1}
        max={5}
        onChange={(e) =>
          setRating(Math.min(5, Math.max(1, Number(e.target.value) || 5)))
        }
      />
      <button
        className="mt-4 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
        onClick={() => handleSave(book, firstPage, lastPage, rating)}
      >
        保存
      </button>
    </div>
  );
};
