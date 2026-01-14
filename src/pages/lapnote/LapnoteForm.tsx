import type { RefObject } from "react";

const LapnoteForm = ({
  states: { note, refPage },
  textareaRef,
  handlers: { setNote, setRefPage },
}: {
  states: {
    note: string;
    refPage: number;
  };
  textareaRef: RefObject<HTMLTextAreaElement>;
  handlers: {
    setNote: (value: string) => void;
    setRefPage: (value: number) => void;
  };
}) => (
  <div className="mt-4 flex flex-col gap-2">
    <label className="text-sm font-semibold text-gray-600">メモ</label>
    <textarea
      ref={textareaRef}
      className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
      rows={3}
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="内容を記録してから Lap または Stop を押します"
    />
    <label className="text-sm font-semibold text-gray-600">参照ページ</label>
    <input
      type="number"
      className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
      value={refPage}
      min={1}
      onChange={(e) => setRefPage(Number(e.target.value) || 1)}
    />
  </div>
);

export default LapnoteForm;
