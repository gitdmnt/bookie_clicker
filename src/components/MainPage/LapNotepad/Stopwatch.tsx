import { StopwatchTime } from "@/types";

export const Stopwatch = ({ time }: { time: StopwatchTime }) => {
  const pad2 = (n: number) => `${n}`.padStart(2, "0");
  const s = pad2(time.s);
  const m = pad2(time.m);
  const h = pad2(time.h);

  return <div className="text-5xl m-4">{`${h}:${m}:${s}`}</div>;
};
