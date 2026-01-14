import { formatTime } from "../utils";

const TimerDisplay = ({ time }: { time: StopwatchTime }) => (
  <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-100 p-4 text-center text-4xl font-bold text-gray-800">
    {formatTime(time)}
  </div>
);

export default TimerDisplay;
