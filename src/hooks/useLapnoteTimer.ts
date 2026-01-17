import { addLaps } from "@/utils/api";
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

  // reading log states
  const [firstPage, setFirstPage] = useState(1);
  const [isFPUpdatedByUser, setIsFPUpdatedByUser] = useState(false);
  const [lastPage, setLastPage] = useState(1);
  const [isLPUpdatedByUser, setIsLPUpdatedByUser] = useState(false);
  const [rating, setRating] = useState(5);

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
        // 前回のLapのページ番号を次のデフォルト値として設定
        if (res.length > 0) {
          const lastLap = res[res.length - 1];
          if (lastLap.refPage) {
            setRefPage(lastLap.refPage);
          }
        }
        textareaRef.current?.focus();
      })
      .catch((error) => {
        console.error("timer_get_laps failed", error);
      });
  };

  // Handlers to Start / Stop / Lap / Reset
  const handleStart = async () => {
    try {
      await invoke<TimerTick>("timer_start").then(() => {
        setIsRunning(true);
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

      if (!isFPUpdatedByUser) {
        const smallestPage = laps.reduce((min, lap) => {
          return lap.refPage < min ? lap.refPage : min;
        }, refPage);
        setFirstPage(smallestPage);
      }
      if (!isLPUpdatedByUser) {
        const largestPage = laps.reduce((max, lap) => {
          return lap.refPage > max ? lap.refPage : max;
        }, refPage);
        setLastPage(largestPage);
      }
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
      await refreshLapnoteLogs();
    }
  };

  // Handlers to Save Lap Note
  const handleFirstPageChange = (value: number) => {
    setFirstPage(value);
    setIsFPUpdatedByUser(true);
  };
  const handleLastPageChange = (value: number) => {
    setLastPage(value);
    setIsLPUpdatedByUser(true);
  };

  const handleSave = async (
    book: Book | null,
    firstPage: number,
    lastPage: number,
    rating: number
  ) => {
    if (!book) return;

    const createdAt = Temporal.Now.plainDateTimeISO();
    const sessionDurationSec = time.h * 3600 + time.m * 60 + time.s;

    const readingLog: ReadingLog = {
      isbn: book.isbn,
      createdAt,
      sessionDurationSec,
      page: [firstPage, lastPage],
      rating,
    };

    addLaps(readingLog, laps).catch((error) => {
      console.error("Failed to save laps", error);
    });
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

  const timerStates = {
    isRunning,
    time,
  };
  const timerHandlers = {
    handleStart,
    handleLap,
    handleStop,
    handleReset,
  };

  const lapStates = {
    laps,
    note,
    refPage,
  };
  const lapHandlers = {
    setNote,
    setRefPage,
  };

  const textareaEl = textareaRef;

  const saveStates = {
    firstPage,
    lastPage,
    rating,
  };
  const saveHandlers = {
    handleFirstPageChange,
    handleLastPageChange,
    setRating,
    handleSave,
  };

  return {
    // states
    timerStates,
    lapStates,
    saveStates,

    // handlers
    timerHandlers,
    lapHandlers,
    saveHandlers,

    // refs
    textareaEl,
  };
};
