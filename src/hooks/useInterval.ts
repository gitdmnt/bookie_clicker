import { useRef, useEffect } from "react";

const useInterval = (callback: () => void, delay?: number | null) => {
  const savedCallback = useRef(() => {});

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      let interval = setInterval(savedCallback.current, delay || 0);
      return () => clearInterval(interval);
    }
  }, [delay]);
};

export default useInterval;
