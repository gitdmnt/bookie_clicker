import type { RefObject } from "react";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";
import { SingleSlider } from "@/components/ui/RangeSlider";

export const LapnoteForm = ({
  states: { note, refPage },
  textareaRef,
  handlers: { setNote, setRefPage, handleLap },
  onClose,
  book,
}: {
  states: {
    note: string;
    refPage: number;
  };
  textareaRef: RefObject<HTMLTextAreaElement>;
  handlers: {
    setNote: (value: string) => void;
    setRefPage: (value: number) => void;
    handleLap: () => void;
  };
  onClose: () => void;
  book: Book | null;
}) => {
  const maxPage = book?.pageCount || 500;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className=""
    >
      <label className="text-sm font-bold text-black uppercase tracking-wide mb-3 block">
        📝 ラップノート
      </label>
      <div className="rounded-lg border-3 border-black bg-white shadow-brutal-sm p-5">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-nb-pink-600 uppercase tracking-wide">
              Page
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRefPage(Math.max(1, refPage - 1))}
                className="w-8 h-8 rounded-md border-2 border-black bg-white hover:bg-nb-pink-100 font-bold text-lg flex items-center justify-center shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                aria-label="Previous page"
              >
                −
              </button>
              <input
                type="number"
                value={refPage}
                min={1}
                max={maxPage}
                onChange={(e) => setRefPage(Number(e.target.value) || 1)}
                className="w-20 rounded-lg border-2 border-black px-2 py-1 font-bold text-center text-lg bg-nb-yellow focus:outline-none focus:ring-2 focus:ring-nb-pink-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setRefPage(Math.min(maxPage, refPage + 1))}
                className="w-8 h-8 rounded-md border-2 border-black bg-white hover:bg-nb-pink-100 font-bold text-lg flex items-center justify-center shadow-brutal-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                aria-label="Next page"
              >
                +
              </button>
              <span className="text-sm font-semibold text-gray-500">
                / {maxPage}
              </span>
            </div>
          </div>
          <SingleSlider
            min={1}
            max={maxPage}
            value={refPage}
            onChange={setRefPage}
            color="pink"
          />
        </div>
        <div>
          <textarea
            ref={textareaRef}
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="内容を記録してから Lap または Stop を押します"
            className="w-full rounded-lg border-2 border-black px-4 py-3 font-medium bg-white focus:outline-none focus:ring-4 focus:ring-nb-pink-300 transition-all resize-none text-base"
          />
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            type="button"
            variant="primary"
            onClick={handleLap}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                d="M20 6L9 17l-5-5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            記録
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-14 h-14 rounded-full flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
