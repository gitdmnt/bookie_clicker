export const BookshelfHeader = ({
  totalBooks,
  filteredBooks,
  searchTerm,
  onSearchTermChange,
}: {
  totalBooks: number;
  filteredBooks: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}) => (
  <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg space-y-2">
    <div>
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        className="w-full rounded-lg border-3 border-black bg-white px-4 py-3 text-base font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-nb-pink-200 shadow-brutal-sm"
        placeholder="🔍 タイトル・著者・出版社・年で検索"
        aria-label="Search books"
      />
    </div>
    <div className="text-xs font-semibold text-gray-500 px-1">
      {filteredBooks} / {totalBooks} titles
    </div>
  </div>
);
