import React, { useState } from "react";
import useInterval from "./useInterval";

interface Time {
  hh: number;
  mm: number;
  ss: number;
}

const useStopwatch = () => {
  const [time, setTime] = useState<Time>({ hh: 0, mm: 0, ss: 0 });
  const [isRunning, setIsRunning] = useState(false);

  const updateTime = () => {
    let { hh, mm, ss } = time;
    ss += 1;
    if (ss === 60) {
      ss = 0;
      mm += 1;
      if (mm === 60) {
        mm = 0;
        hh += 1;
      }
    }
    setTime({ hh, mm, ss });
  };

  useInterval(updateTime, isRunning ? 1000 : null);

  const handleButton1 = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime({ hh: 0, mm: 0, ss: 0 });
  };

  const StartSVG = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 4 v16 l13.84 -8 Z"
      />
    </svg>
  );

  const EndSVG = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4 h5 v16 h-5 Z M15 4 h5 v16 h-6 Z"
      />
    </svg>
  );

  const StopwatchElement = () => (
    <div className="w-full h-full flex justify-center">
      <div className="w-64 m-4 mt-12 align-middle">
        <div className="text-5xl text-center">
          {`${time.hh}`.padStart(2, "0")}:{`${time.mm}`.padStart(2, "0")}:
          {`${time.ss}`.padStart(2, "0")}
        </div>
        <div className="flex justify-between p-4">
          <button
            onClick={handleButton1}
            className="p-4 shadow-md rounded-full bg-white"
          >
            {isRunning ? <EndSVG /> : <StartSVG />}
          </button>
          <button
            onClick={handleReset}
            className="p-4 shadow-md rounded-full bg-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4 h16 v16 h-16 Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return { StopwatchElement, time, isRunning };
};

export default useStopwatch;

