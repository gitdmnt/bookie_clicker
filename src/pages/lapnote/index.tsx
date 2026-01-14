import BookDisplay from "./components/BookDisplay";
import TimerDisplay from "./components/TimerDisplay";
import TimerControls from "./components/TimerControls";
import LapnoteForm from "./components/LapnoteForm";
import LapHistory from "./components/LapHistory";
import { useLapnoteTimer } from "@/hooks/useLapnoteTimer";

export const Lapnote = ({ book }: { book: Book | null }) => {
  const lapnoteTimer = useLapnoteTimer();
  const timerStates = {
    time: lapnoteTimer.time,
    isRunning: lapnoteTimer.isRunning,
  };
  const timerHandlers = {
    handleStart: lapnoteTimer.handleStart,
    handleLap: lapnoteTimer.handleLap,
    handleStop: lapnoteTimer.handleStop,
    handleReset: lapnoteTimer.handleReset,
  };

  const lapStates = {
    laps: lapnoteTimer.laps,
    note: lapnoteTimer.note,
    refPage: lapnoteTimer.refPage,
  };
  const lapHandlers = {
    setNote: lapnoteTimer.setNote,
    setRefPage: lapnoteTimer.setRefPage,
    handleSave: lapnoteTimer.handleSave,
  };

  const textareaEl = lapnoteTimer.textareaRef;

  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <BookDisplay book={book} />
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-800">Lapnote</h1>
        <p className="mt-2 text-sm text-gray-500">
          タイマー測定とラップメモをこのページで行います。
        </p>
        <TimerDisplay time={timerStates.time} />
        <div className="flex items-center gap-2">
          <TimerControls
            isRunning={timerStates.isRunning}
            handlers={timerHandlers}
          />
        </div>
        <LapnoteForm
          states={lapStates}
          textareaRef={textareaEl}
          handlers={lapHandlers}
        />
        <LapHistory states={lapStates} />
      </section>
    </main>
  );
};
