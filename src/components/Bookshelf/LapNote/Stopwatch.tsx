import React, { memo, useState } from "react";
import useInterval from "@/hooks/useInterval";

// 型定義
interface Time {
  hh: number;
  mm: number;
  ss: number;
}

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// 時間表示用のフォーマット関数
const formatTime = (time: Time): string => {
  const { hh, mm, ss } = time;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
    2,
    "0"
  )}:${String(ss).padStart(2, "0")}`;
};

const Button = memo(({ onClick, children }: ButtonProps) => (
  <button onClick={onClick} className="p-4 shadow-md rounded-full bg-white">
    {children}
  </button>
));

const StartSVG = memo(() => (
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
));

const StopSVG = memo(() => (
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
));

const ResetSVG = memo(() => (
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
));

const Stopwatch = ({ onLap, onReset }: any) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState<Time>({ hh: 0, mm: 0, ss: 0 });

  // 時間更新ロジック
  const updateTime = () => {
    setTime((prevTime) => {
      let { hh, mm, ss } = prevTime;
      ss += 1;
      if (ss === 60) {
        ss = 0;
        mm += 1;
        if (mm === 60) {
          mm = 0;
          hh += 1;
        }
      }
      return { hh, mm, ss };
    });
  };

  useInterval(updateTime, isRunning ? 1000 : null);

  // ボタンハンドラー
  const handleStartStop = () => {
    setIsRunning((prev) => !prev);
  };

  const handleLapReset = () => {
    if (isRunning) {
      // ラップタイム記録
      onLap(time);
    } else {
      // リセット
      setTime({ hh: 0, mm: 0, ss: 0 });
      onReset();
    }
  };

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-64 m-4 mt-12 align-middle">
        <div className="text-5xl text-center">{formatTime(time)}</div>
        <div className="flex justify-between p-4">
          <Button onClick={handleStartStop}>
            {isRunning ? <StopSVG /> : <StartSVG />}
          </Button>
          <Button onClick={handleLapReset}>
            <ResetSVG />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;

