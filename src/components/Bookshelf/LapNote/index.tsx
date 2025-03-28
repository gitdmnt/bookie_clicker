import { useState } from "react";
import Stopwatch from "./Stopwatch";

interface Time {
  hh: number;
  mm: number;
  ss: number;
}

const formatTime = (time: Time): string => {
  const { hh, mm, ss } = time;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
    2,
    "0"
  )}:${String(ss).padStart(2, "0")}`;
};

const LapNote = () => {
  const [note, setNote] = useState("");
  const [time, setTime] = useState<Time | null>(null);
  const [lapTime, setLapTime] = useState<Time[]>([]);
  const [lapNote, setLapNote] = useState<String[]>([]);

  const onStart = () => {
    setTime(null);
  };

  const onStop = (time: Time) => {
    setTime(time);
  };

  const onLap = (time: Time) => {
    setLapTime((prev: Time[]) => [...prev, time]);
    setLapNote((prev: String[]) => [...prev, note]);
    setNote("");
  };
  const onReset = () => {
    setLapTime([]);
    setLapNote([]);
  };

  return (
    <div>
      <Stopwatch
        onStart={onStart}
        onStop={onStop}
        onLap={onLap}
        onReset={onReset}
      />
      <textarea
        className="w-full rounded-lg p-2"
        placeholder="メモ"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
        }}
      />
      {lapTime.map((time: Time, i: number) => (
        <div key={i} className="mt-2 p-2 border-t border-gray-200">
          <div className="font-semibold">{formatTime(time)}</div>
          <div className="text-gray-700">{lapNote[i]}</div>
        </div>
      ))}
    </div>
  );
};

export default LapNote;

