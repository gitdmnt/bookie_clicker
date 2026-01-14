import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

import BookDisplay from "./components/BookDisplay";
import TimerDisplay from "./components/TimerDisplay";
import TimerControls from "./components/TimerControls";
import LapnoteForm from "./components/LapnoteForm";
import LapHistory from "./components/LapHistory";
import { addReadingLogWithLaps } from "@/utils/api";

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

  const handleSave = async () => {
    try {
      if (!book) return;
      if (lapNotes.length === 0) return; // nothing to save

      const first = lapNotes[0];
      const last = lapNotes[lapNotes.length - 1];

      const readingLog: ReadingLog = {
        isbn: book.isbn,
        // use first and last lap timestamps
        time: [
          first.createdAt?.toString() ?? "",
          last.createdAt?.toString() ?? "",
        ],
        page: [first.refPage ?? 0, last.refPage ?? first.refPage ?? 0],
        note: "",
        rating: 0,
        id: undefined,
      };

      await addReadingLogWithLaps(readingLog, lapNotes);
      await refreshLapnoteLogs();
      // Optionally reset timer after save
      // await handleReset();
    } catch (error) {
      console.error("Failed to save reading log with laps", error);
    }
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
        <div className="flex items-center gap-2">
          <TimerControls
            isRunning={isRunning}
            onStart={() => void handleStart()}
            onLap={() => void handleLap()}
            onStop={() => void handleStop()}
            onReset={() => void handleReset()}
          />
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => void handleSave()}
            title="Save this session as a reading log"
          >
            Save
          </button>
        </div>
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
