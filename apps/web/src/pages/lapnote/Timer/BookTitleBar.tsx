export const BookTitleBar = ({
  book,
  onInfoClick,
}: {
  book: Book | null;
  onInfoClick: () => void;
}) => (
  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-black text-black truncate">
        📖 {book?.title || "本を選択してください"}
      </h3>
    </div>
    <button
      onClick={onInfoClick}
      className="ml-2 w-7 h-7 rounded-full border-2 border-black bg-nb-blue hover:bg-nb-blue/80 flex items-center justify-center font-black text-sm shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all flex-shrink-0"
      aria-label="Book information"
    >
      i
    </button>
  </div>
);
