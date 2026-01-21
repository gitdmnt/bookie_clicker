const pad = (value: number) => String(value).padStart(2, "0");

export const msToTime = (ms: number): StopwatchTime => {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
};

export const formatTime = (time: StopwatchTime) =>
  `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`;

export const formatElapsed = (milliseconds: number) =>
  formatTime(msToTime(milliseconds));
