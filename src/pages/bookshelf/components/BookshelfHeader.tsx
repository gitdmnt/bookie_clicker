export const BookshelfHeader = ({
  totalBooks,
  filteredBooks,
  searchTerm,
  onSearchTermChange,
  onRefresh,
}: {
  totalBooks: number;
  filteredBooks: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onRefresh: () => void;
}) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-500">Bookshelf</p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Currently Reading
        </h1>
      </div>
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400/80"
        onClick={onRefresh}
      >
        Refresh library
      </button>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
        {filteredBooks} / {totalBooks} titles
      </div>
      <div className="flex-1">
        <label className="sr-only">Search books</label>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
          placeholder="タイトル・著者・出版社・年で検索"
        />
      </div>
    </div>
  </div>
);
