import { Modal } from "@/components/ui/Modal";

export const BookInfoModal = ({
  book,
  isOpen,
  onClose,
}: {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <img
          src={book?.imageUrl}
          alt={book?.title}
          className="w-24 h-36 object-cover rounded border-3 border-black shadow-brutal"
        />
        <div className="flex-1">
          <h2 className="text-xl font-black text-black mb-2 leading-tight">
            {book?.title}
          </h2>
          <div className="space-y-1 text-sm font-semibold text-gray-700">
            <p>📝 {(book?.authors ?? []).join(", ")}</p>
            <p>🏢 {book?.publisher}</p>
            <p>📅 {book?.year ?? "年不明"}</p>
            <p>📄 {book?.pageCount} ページ</p>
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-lg border-3 border-black bg-nb-pink-500 text-white font-bold shadow-brutal hover:bg-nb-pink-600 active:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] transition-all"
      >
        閉じる
      </button>
    </div>
  </Modal>
);
