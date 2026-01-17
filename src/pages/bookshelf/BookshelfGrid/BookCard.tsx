import { motion } from "framer-motion";

export const BookCard = ({
  book,
  isActive,
  onSelect,
  setPage,
  isAddMode = false,
}: {
  book: Book;
  isActive: boolean;
  onSelect: () => void;
  setPage?: React.Dispatch<React.SetStateAction<number>>;
  isAddMode?: boolean;
}) => (
  <button
    className={`group my-2 ${isActive ? "w-full" : ""}`}
    type="button"
    onClick={onSelect}
  >
    <motion.div
      layout="position"
      initial={false}
      animate={{
        width: isActive ? "calc(100% - 2.5rem)" : "6rem",
        marginRight: isActive ? "0rem" : "-3rem",
        padding: isActive ? "1rem" : "0.25rem",
        zIndex: isActive ? 10 : 1,
      }}
      whileHover={{ zIndex: 20 }}
      transition={
        isActive
          ? {
              width: { duration: 0.3, delay: 0.2 },
              marginRight: { duration: 0.2, delay: 0 },
              padding: { duration: 0.3, delay: 0.2 },
              zIndex: { duration: 0 },
            }
          : {
              width: { duration: 0, delay: 0 },
              marginRight: { duration: 0, delay: 0 },
              padding: { duration: 0, delay: 0 },
              zIndex: { duration: 0 },
            }
      }
      className="flex flex-row gap-4 rounded-lg border-3 border-black box-content bg-nb-pink-50 shadow-brutal-pink hover:shadow-brutal-pink-lg"
      style={{
        backgroundColor: isActive ? undefined : "white",
        boxShadow: isActive ? undefined : "2px 2px 0 black",
      }}
    >
      <div className="shrink-0">
        <img
          src={`https://ndlsearch.ndl.go.jp/thumbnail/${book.isbn}.jpg`}
          alt={book.title}
          className="w-24 h-36 object-cover rounded border-2 border-black"
        />
      </div>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.15, delay: 0.5 },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0, delay: 0 },
          }}
          className="flex-1 flex flex-col items-start justify-between text-left overflow-hidden min-h-0"
        >
          <div className="space-y-1.5 overflow-hidden w-full">
            <h3 className="text-base font-black text-black leading-tight line-clamp-2">
              {book.title}
            </h3>
            <div className="text-xs font-bold text-nb-pink-600 line-clamp-1">
              {(book.authors ?? []).join(" / ")}
            </div>
            <div className="text-xs font-semibold text-gray-600 line-clamp-1">
              {book.publisher} ・ {book.year ?? "年不明"} ・ {book.pageCount}
              ページ
            </div>
          </div>
          {isAddMode ? (
            <button
              type="button"
              className="w-full rounded-lg border-3 border-black bg-nb-yellow px-3 py-2 text-sm font-black text-black shadow-brutal hover:shadow-brutal-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              📚 この本を追加
            </button>
          ) : setPage ? (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                className="flex-1 rounded-lg border-3 border-black bg-nb-blue px-3 py-1.5 text-xs font-black text-white shadow-brutal hover:shadow-brutal-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(0);
                }}
              >
                📖 読む
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border-3 border-black bg-nb-purple px-3 py-1.5 text-xs font-black text-white shadow-brutal hover:shadow-brutal-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(2);
                }}
              >
                📊 記録
              </button>
            </div>
          ) : null}
        </motion.div>
      )}
    </motion.div>
  </button>
);
