import { motion } from "framer-motion";

const BookDisplay = ({ book }: { book: Book | null }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex flex-row gap-3 p-3 bg-white rounded-lg border-3 border-black shadow-brutal"
  >
    <motion.img
      src={book?.imageUrl}
      alt={book?.title}
      className="w-16 h-24 object-cover rounded border-2 border-black shadow-brutal-sm"
      whileHover={{ scale: 1.05, rotate: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    />
    <div className="flex flex-col justify-center gap-1">
      <h2 className="text-base font-black text-black leading-tight">
        {book?.title}
      </h2>
      <p className="text-xs font-semibold text-gray-600">
        {(book?.authors ?? []).join(" / ")} ・ {book?.publisher} ・{" "}
        {book?.year ?? "年不明"} ・ {book?.pageCount}ページ
      </p>
    </div>
  </motion.div>
);

export default BookDisplay;
