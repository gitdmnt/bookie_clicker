export const BookCard = ({
  book,
  isActive,
  onSelect,
  setPage,
}: {
  book: Book;
  isActive: boolean;
  onSelect: () => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`group flex flex-row gap-4 rounded-2xl transition-all hover:shadow-lg ${
      isActive
        ? "border border-slate-500 bg-slate-50 shadow-lg my-2 p-4 w-full"
        : "border border-slate-200 bg-white -mr-8"
    }`}
  >
    <div className="w-20 h-28">
      {book.imageUrl ? (
        <img
          src={book.imageUrl}
          alt={book.title}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <span className="h-full w-full flex items-center justify-center text-xs font-semibold text-slate-500">
          No cover
        </span>
      )}
    </div>
    {isActive ? (
      <div className="flex flex-col items-start gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{book.title}</h3>
        <div className="text-xs text-gray-500">
          {(book.authors ?? []).join(" / ")}
        </div>
        <div className="text-xs text-gray-500">
          {book.publisher} ・ {book.year ?? "年不明"} ・ {book.pageCount}ページ
        </div>
        {setPage && (
          <div>
            <button
              type="button"
              className="text-sm text-blue-600 bg-neutral-300 p-2 rounded-2xl"
              onClick={(e) => {
                e.stopPropagation();
                setPage(0);
              }}
            >
              この本を読む
            </button>
            <button
              type="button"
              className="text-sm text-blue-600 bg-neutral-300 p-2 rounded-2xl"
              onClick={(e) => {
                e.stopPropagation();
                setPage(2);
              }}
            >
              記録を見る
            </button>
          </div>
        )}
      </div>
    ) : null}
  </button>
);
