import BookDisplay from "./BookDisplay";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import LapnoteForm from "./LapnoteForm";
import LapHistory from "./LapHistory";
import { useLapnoteTimer } from "@/hooks/useLapnoteTimer";
import { SaveForm } from "./SaveForm";

export const Lapnote = ({ book }: { book: Book | null }) => {
  const lapnoteTimer = useLapnoteTimer();

  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <BookDisplay book={book} />
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-800">Lapnote</h1>
        <p className="mt-2 text-sm text-gray-500">
          タイマー測定とラップメモをこのページで行います。
        </p>
        <TimerDisplay time={lapnoteTimer.timerStates.time} />
        <div className="flex items-center gap-2">
          <TimerControls
            isRunning={lapnoteTimer.timerStates.isRunning}
            handlers={lapnoteTimer.timerHandlers}
          />
        </div>
        <LapnoteForm
          states={lapnoteTimer.lapStates}
          textareaRef={lapnoteTimer.textareaEl}
          handlers={lapnoteTimer.lapHandlers}
        />
        <LapHistory states={lapnoteTimer.lapStates} />
        <SaveForm
          states={lapnoteTimer.saveStates}
          handlers={lapnoteTimer.saveHandlers}
          book={book}
        />
      </section>
    </main>
  );
};
