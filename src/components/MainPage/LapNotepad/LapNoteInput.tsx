export const LapNoteInput = ({ note, setNote, textareaEl, onKeyDown }: any) => {
  return (
    <div className="flex gap-2 mb-4 w-full">
      <textarea
        className="w-full border-neutral-200 rounded-lg p-2 shadow-inner bg-neutral-100"
        placeholder="Enter your note here..."
        ref={textareaEl}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};
