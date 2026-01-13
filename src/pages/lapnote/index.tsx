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

export const Lapnote = () => {
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

  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-800">Lapnote</h1>
        <p className="mt-2 text-sm text-gray-500">
          タイマー測定とラップメモをこのページで行います。
        </p>
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 text-center text-4xl font-bold text-gray-800">
          {formatTime(time)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-green-300"
            onClick={() => void handleStart()}
            disabled={isRunning}
          >
            Start
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-blue-300"
            onClick={() => void handleLap()}
            disabled={!isRunning}
          >
            Lap
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:bg-red-300"
            onClick={() => void handleStop()}
            disabled={!isRunning}
          >
            Stop
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-600 text-white"
            onClick={() => void handleReset()}
          >
            Reset
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">メモ</label>
          <textarea
            ref={textareaEl}
            className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="内容を記録してから Lap または Stop を押します"
          />
          <label className="text-sm font-semibold text-gray-600">
            参照ページ
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
            value={refPage}
            min={1}
            onChange={(e) => setRefPage(Number(e.target.value) || 1)}
          />
        </div>
        <div className="mt-6 space-y-4">
          {lapNotes.map((log, index) => (
            <div key={index} className="rounded-lg bg-white p-2 shadow-sm">
              <div className="text-xs text-neutral-400">
                {formatTime(msToTime(log.elapsedMs))} · p.{log.refPage}
              </div>
              <p>{log.note}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
