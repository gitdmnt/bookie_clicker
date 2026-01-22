export const BookDisplay = ({ book }: { book: Book | null }) => {
  if (!book) {
    return (
      <div className="rounded-lg border-3 border-black bg-white p-6 shadow-brutal-lg text-center">
        <div className="text-4xl mb-2">📚</div>
        <p className="text-gray-600 font-semibold">本が選択されていません</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-3 border-black bg-gradient-to-br from-nb-pink-50 to-white p-6 shadow-brutal-lg">
      <div className="flex items-start gap-6">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              src={book.imageUrl}
              alt={book.title}
              className="h-40 w-28 rounded border-3 border-black object-cover shadow-brutal"
            />
            <div className="absolute -top-2 -right-2 bg-nb-yellow text-black text-xs font-black px-2 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-12">
              📖
            </div>
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-black mb-3 line-clamp-2">
            {book.title}
          </h2>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                著者
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {book.authors}
              </span>
            </div>

            {book.publisher && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  出版社
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {book.publisher}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                ページ数
              </span>
              <span className="inline-block px-3 py-1 bg-nb-blue text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {book.pageCount} ページ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
