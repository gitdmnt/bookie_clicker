import {
  addLaps,
  startTimer,
  stopTimer,
  resetTimer,
  getTimer,
  getTimerLaps,
  timerLap,
  onTimerTick,
  saveTimerSession,
} from "@/utils/api";
import { isTauri } from "@/utils/env-detect";
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
    try {
      const curr = await getTimer();
      setTime({ h: curr.h, m: curr.m, s: curr.s });
    } catch (error) {
      console.error("timer_get failed", error);
    }
  };

  const refreshLapnoteLogs = async () => {
    try {
      const res = await getTimerLaps();
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
    } catch (error) {
      console.error("timer_get_laps failed", error);
    }
  };

  // Handlers to Start / Stop / Lap / Reset
  const handleStart = async () => {
    try {
      await startTimer().then(() => {
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
      await timerLap(note, refPage);
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
      await stopTimer().then(() => {
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
      await resetTimer().then(() => {
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
    rating: number,
  ) => {
    if (!book) return;

    if (isTauri()) {
      // Tauri版: 従来通り addLaps で保存
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
    } else {
      // Web版: saveTimerSession でバックエンドにセッション保存
      try {
        await saveTimerSession(book.isbn, firstPage, lastPage, rating, laps);
      } catch (error) {
        console.error("Failed to save timer session", error);
      }
    }
  };

  // Event listener
  useEffect(() => {
    let unlisten: (() => Promise<void> | void) | null = null;
    (async () => {
      try {
        unlisten = await onTimerTick((payload) => {
          setTime({ h: payload.h, m: payload.m, s: payload.s });
          setIsRunning(payload.isRunning);
        });
      } catch (e) {
        console.error("onTimerTick registration failed", e);
      }
    })();
    return () => {
      void unlisten?.();
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

