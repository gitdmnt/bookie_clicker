import { useCallback, useEffect, useRef, useState } from "react";

type Time = { h: number; m: number; s: number };

const useTimer = (tickMs = 1000) => {
  const [isRunning, setIsRunning] = useState(false);
  const timeRef = useRef<Time>({ h: 0, m: 0, s: 0 });
  const [time, setTime] = useState<Time>(timeRef.current); // UI で表示する state
  const intervalRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const t = timeRef.current;
    let s = t.s + 1;
    let m = t.m;
    let h = t.h;
    if (s >= 60) {
      s = 0;
      m++;
      if (m >= 60) {
        m = 0;
        h++;
      }
    }
    timeRef.current = { h, m, s };
    setTime(timeRef.current); // UI に反映させるための state 更新
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return;
    setIsRunning(true);
    intervalRef.current = window.setInterval(tick, tickMs);
  }, [tick, tickMs]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    timeRef.current = { h: 0, m: 0, s: 0 };
    setTime(timeRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { isRunning, start, stop, reset, timeRef, time, setIsRunning };
};

export default useTimer;
