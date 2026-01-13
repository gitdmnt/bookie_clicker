import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

const pad = (value: number) => String(value).padStart(2, "0");

const msToTime = (ms: number): StopwatchTime => {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
};

const formatTime = (time: StopwatchTime) =>
  `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`;

interface TimerTick {
  elapsed: number;
  h: number;
  m: number;
  s: number;
  isRunning: boolean;
}

const formatElapsed = (milliseconds: number) =>
  formatTime(msToTime(milliseconds));

const BookDisplay = ({ book }: { book: Book | null }) => (
  <div className="">
    <img src={book?.imageUrl} alt={book?.title} className="" />
    <div>
      <h2 className="">{book?.title}</h2>
      <p className="">
        {(book?.authors ?? []).join(" / ")} ・ {book?.publisher} ・{" "}
        {book?.year ?? "年不明"} ・ {book?.pageCount}ページ
      </p>
    </div>
  </div>
);

const TimerDisplay = ({ time }: { time: StopwatchTime }) => (
  <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 text-center text-4xl font-bold text-gray-800">
    {formatTime(time)}
  </div>
);

const TimerControls = ({
  isRunning,
  onStart,
  onLap,
  onStop,
  onReset,
}: {
  isRunning: boolean;
  onStart: () => void;
  onLap: () => void;
  onStop: () => void;
  onReset: () => void;
}) => (
  <div className="mt-4 flex flex-wrap gap-2">
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-green-300"
      onClick={onStart}
      disabled={isRunning}
    >
      Start
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-blue-300"
      onClick={onLap}
      disabled={!isRunning}
    >
      Lap
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:bg-red-300"
      onClick={onStop}
      disabled={!isRunning}
    >
      Stop
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-gray-600 text-white"
      onClick={onReset}
    >
      Reset
    </button>
  </div>
);

const LapnoteForm = ({
  note,
  refPage,
  textareaRef,
  onNoteChange,
  onRefPageChange,
}: {
  note: string;
  refPage: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onNoteChange: (value: string) => void;
  onRefPageChange: (value: number) => void;
}) => (
  <div className="mt-4 flex flex-col gap-2">
    <label className="text-sm font-semibold text-gray-600">メモ</label>
    <textarea
      ref={textareaRef}
      className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
      rows={3}
      value={note}
      onChange={(e) => onNoteChange(e.target.value)}
      placeholder="内容を記録してから Lap または Stop を押します"
    />
    <label className="text-sm font-semibold text-gray-600">参照ページ</label>
    <input
      type="number"
      className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
      value={refPage}
      min={1}
      onChange={(e) => onRefPageChange(Number(e.target.value) || 1)}
    />
  </div>
);

const LapHistory = ({ logs }: { logs: Lap[] }) => (
  <div className="mt-6 space-y-4">
    {logs.map((log, index) => (
      <div
        key={index}
        className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <div className="rounded-lg bg-white p-2 shadow-sm">
          <div className="text-xs text-neutral-400">
            {formatElapsed(log.elapsedMs)} · p.
            {log.refPage ?? "—"}
          </div>
          <p>{log.note ?? "(メモなし)"}</p>
        </div>
      </div>
    ))}
  </div>
);

export const Lapnote = ({ book }: { book: Book | null }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState<StopwatchTime>({ h: 0, m: 0, s: 0 });
  const [lapNotes, setLapNotes] = useState<Lap[]>([]);
  const [note, setNote] = useState("");
  const [refPage, setRefPage] = useState(1);
  const textareaEl = useRef<HTMLTextAreaElement>(null);

  const refreshTime = async () => {
    try {
      const currentTime = await invoke<TimerTick>("timer_get");
      setTime({ h: currentTime.h, m: currentTime.m, s: currentTime.s });
    } catch (error) {
      console.error("timer_get failed", error);
    }
  };

  const refreshLapnoteLogs = async () => {
    try {
      const logs = await invoke<Lap[]>("timer_get_laps");
      console.log("logs", logs);
      setLapNotes(logs);
      setNote("");
    } catch (error) {
      console.error("timer_get_laps failed", error);
    }
  };

  const handleStart = async () => {
    try {
      await invoke("timer_start");
      await refreshTime();
      await refreshLapnoteLogs();
      setIsRunning(true);
    } catch (error) {
      console.log("uo", isRunning);
      console.error("timer_start or timer_get_laps failed", error);
    }
    textareaEl.current?.focus();
  };

  const handleLap = async () => {
    try {
      await invoke("timer_lap", { note, refPage });
      await refreshLapnoteLogs();
    } catch (error) {
      console.error("timer_lap failed", error);
    }
    textareaEl.current?.focus();
  };

  const handleStop = async () => {
    try {
      await invoke("timer_stop");
      setIsRunning(false);
      await refreshTime();
      await refreshLapnoteLogs();
    } catch (error) {
      console.error("timer_stop failed", error);
    }
    textareaEl.current?.focus();
  };

  const handleReset = async () => {
    try {
      await invoke("timer_reset");
      await refreshTime();
      await refreshLapnoteLogs();
    } catch (error) {
      console.error("timer_reset failed", error);
    }
    textareaEl.current?.focus();
  };

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    (async () => {
      unlisten = await listen("timer:tick", (event) => {
        const payload = event.payload as TimerTick;
        setTime({ h: payload.h, m: payload.m, s: payload.s });
        setIsRunning(payload.isRunning);
      });
    })();
    return () => {
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    void refreshTime();
    void refreshLapnoteLogs();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <BookDisplay book={book} />
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-800">Lapnote</h1>
        <p className="mt-2 text-sm text-gray-500">
          タイマー測定とラップメモをこのページで行います。
        </p>
        <TimerDisplay time={time} />
        <TimerControls
          isRunning={isRunning}
          onStart={() => void handleStart()}
          onLap={() => void handleLap()}
          onStop={() => void handleStop()}
          onReset={() => void handleReset()}
        />
        <LapnoteForm
          note={note}
          refPage={refPage}
          textareaRef={textareaEl}
          onNoteChange={setNote}
          onRefPageChange={setRefPage}
        />
        <LapHistory logs={lapNotes} />
      </section>
    </main>
  );
};
