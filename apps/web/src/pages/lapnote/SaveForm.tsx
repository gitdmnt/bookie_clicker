import Button from "@/components/ui/Button";
import { RangeSlider, SingleSlider } from "@/components/ui/RangeSlider";
import { Modal } from "@/components/ui/Modal";
import { useState } from "react";

const IconReset = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className="w-5 h-5"
  >
    <path
      d="M1 4v6h6M23 20v-6h-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSave = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className="w-5 h-5"
  >
    <path
      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 21v-8H7v8M7 3v5h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SaveForm = ({
  states: { firstPage, lastPage, rating },
  handlers: {
    handleFirstPageChange,
    handleLastPageChange,
    setRating,
    handleSave,
    handleReset,
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
    handleReset: () => void;
  };
  book: Book | null;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const maxPage = book?.pageCount || 500;

  const onSave = async () => {
    await handleSave(book, firstPage, lastPage, rating);
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
    handleReset();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-bold text-black uppercase tracking-wide mb-3 block">
          読んだページ範囲
        </label>
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-center">
            <span className="text-xs font-bold text-nb-pink-600 uppercase tracking-wide block mb-1">
              開始
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleFirstPageChange(Math.max(1, firstPage - 1))
                }
                className="w-7 h-7 rounded-md border-2 border-black bg-white hover:bg-nb-pink-100 font-bold text-base flex items-center justify-center shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                aria-label="Decrease start page"
              >
                −
              </button>
              <span className="text-xl font-black text-black min-w-[3rem] text-center">
                {firstPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleFirstPageChange(Math.min(lastPage, firstPage + 1))
                }
                className="w-7 h-7 rounded-md border-2 border-black bg-white hover:bg-nb-pink-100 font-bold text-base flex items-center justify-center shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                aria-label="Increase start page"
              >
                +
              </button>
            </div>
          </div>

          <span className="text-xl font-black text-nb-pink-500 px-2">〜</span>

          <div className="text-center">
            <span className="text-xs font-bold text-nb-pink-600 uppercase tracking-wide block mb-1">
              終了
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleLastPageChange(Math.max(firstPage, lastPage - 1))
                }
                className="w-7 h-7 rounded-md border-2 border-black bg-white hover:bg-nb-pink-100 font-bold text-base flex items-center justify-center shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                aria-label="Decrease end page"
              >
                −
              </button>
              <span className="text-xl font-black text-black min-w-[3rem] text-center">
                {lastPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleLastPageChange(Math.min(maxPage, lastPage + 1))
                }
                className="w-7 h-7 rounded-md border-2 border-black bg-white hover:bg-nb-pink-100 font-bold text-base flex items-center justify-center shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                aria-label="Increase end page"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <RangeSlider
          min={1}
          max={maxPage}
          valueStart={firstPage}
          valueEnd={lastPage}
          onChangeStart={handleFirstPageChange}
          onChangeEnd={handleLastPageChange}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-nb-pink-600 uppercase tracking-wide">
            評価
          </label>
          <span className="text-2xl font-black text-nb-pink-500">
            {"⭐".repeat(rating)}
          </span>
        </div>
        <SingleSlider
          min={1}
          max={5}
          value={rating}
          onChange={setRating}
          color="yellow"
        />
      </div>

      <div className="flex gap-3 mt-2">
        <Button
          className="flex-1 flex items-center justify-center gap-2"
          onClick={onSave}
        >
          <IconSave />
          保存
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          aria-label="Reset timer"
          className="w-14 h-14 rounded-full flex items-center justify-center"
        >
          <IconReset />
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={onCloseModal}>
        <div className="text-center p-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-black text-black">保存完了！</h2>
          <p className="text-base text-gray-700">読書記録を保存しました。</p>
          <Button onClick={onCloseModal} className="w-full">
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
};
