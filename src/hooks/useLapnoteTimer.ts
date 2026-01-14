import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

import { Temporal } from "temporal-polyfill";

export const useLapnoteTimer = () => {
  // Timer states
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState<StopwatchTime>({
    h: 0,
    m: 0,
    s: 0,
  });

  // Lap note states
  const [laps, setLaps] = useState<Lap[]>([]);
  const [note, setNote] = useState("");
  const [refPage, setRefPage] = useState(1);

  // ref to textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // helpers to refresh time and lap notes
  const refreshTime = async () => {
    await invoke<TimerTick>("timer_get")
      .then((curr) => {
        setTime({ h: curr.h, m: curr.m, s: curr.s });
      })
      .catch((error) => {
        console.error("timer_get failed", error);
      });
  };

  const refreshLapnoteLogs = async () => {
    await invoke<Lap[]>("timer_get_laps")
      .then((res) => {
        setLaps(res);
        setNote("");
        textareaRef.current?.focus();
      })
      .catch((error) => {
        console.error("timer_get_laps failed", error);
      });
  };

  // Handlers to Start / Stop / Lap / Reset
  const handleStart = async () => {
    try {
      await invoke<TimerTick>("timer_start").then((tick) => {
        setIsRunning(tick.isRunning);
        textareaRef.current?.focus();
      });
    } catch (error) {
      console.error("timer_start failed", error);
    } finally {
      await refreshTime();
    }
  };

  const handleLap = async () => {
    try {
      await invoke<Lap>("timer_lap", { note, refPage });
      await refreshLapnoteLogs();
    } catch (error) {
      console.error("timer_lap failed", error);
    }
  };

  const handleStop = async () => {
    try {
      await invoke("timer_stop").then(() => {
        setIsRunning(false); // should be false
      });
    } catch (error) {
      console.error("timer_stop failed", error);
    } finally {
      await refreshTime();
    }
  };

  const handleReset = async () => {
    try {
      await invoke("timer_reset").then(() => {
        setIsRunning(false); // should be false
      });
    } catch (error) {
      console.error("timer_reset failed", error);
    } finally {
      await refreshTime();
    }
  };

  // Handler to Save Lap Note
  const handleSave = async (
    book: Book | null,
    firstPage: number,
    lastPage: number
  ) => {
    if (!book) return;

    const createdAt = Temporal.Now.plainDateTimeISO();
    const sessionDurationSec = time.h * 3600 + time.m * 60 + time.s;

    const readingLog: ReadingLog = {
      isbn: book.isbn,
      createdAt,
      sessionDurationSec,
      page: [firstPage, lastPage],
      rating: 0,
    };

    try {
      await invoke("add_laps", {
        readingLog,
        laps,
      });
    } catch (error) {
      console.error("Failed to save reading log with laps", error);
    }
  };

  // Event listener
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

  return {
    // states
    isRunning,
    time,
    laps,
    note,
    setNote,
    refPage,
    setRefPage,
    // handlers
    handleStart,
    handleLap,
    handleStop,
    handleReset,
    handleSave,
    // refs
    textareaRef,
  };
};
