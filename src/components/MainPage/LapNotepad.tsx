import { useRef, useEffect, useState } from "react";
import { LapNote, StopwatchTime } from "@/types";
import useInterval from "@/hooks/useInterval";
import Lap from "@/assets/icons/lap.svg";
import Reset from "@/assets/icons/reset.svg";
import Start from "@/assets/icons/start.svg";
import Stop from "@/assets/icons/stop.svg";
import Slider from "@mui/material/Slider";

const Stopwatch = ({
  isTimerRunning,
  time,
}: {
  isTimerRunning: boolean;
  time: React.MutableRefObject<StopwatchTime>;
}) => {
  const [_, setDummy] = useState(0);
  const s = `${time.current.s}`.padStart(2, "0");
  const m = `${time.current.m}`.padStart(2, "0");
  const h = `${time.current.h}`.padStart(2, "0");
  const updateTime = () => {
    const newTime = {
      h: time.current.h,
      m: time.current.m,
      s: time.current.s + 1,
    };
    if (newTime.s === 60) {
      newTime.m += 1;
      newTime.s = 0;
      if (newTime.m === 60) {
        newTime.h += 1;
        newTime.m = 0;
      }
    }
    time.current = newTime;
    setDummy((prev) => prev + 1);
  };

  useInterval(updateTime, isTimerRunning ? 1000 : null);

  return <div>{`${h}:${m}:${s}`}</div>;
};

const ControlPanel = ({
  isTimerRunning,
  refPage,
  setRefPage,
  onStart,
  onStop,
  onLap,
  onReset,
}: any) => {
  const [rangeMin, setRangeMin] = useState(1);
  const [rangeMax, setRangeMax] = useState(600);

  const handleStartStop = () => {
    if (isTimerRunning) {
      onStop();
    } else {
      onStart();
    }
  };
  const handleLapReset = () => {
    if (isTimerRunning) {
      onLap();
    } else {
      onReset();
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <button onClick={handleStartStop}>
          {isTimerRunning ? "Stop" : "Start"}
        </button>
        <button onClick={handleLapReset}>
          {isTimerRunning ? "Lap" : "Reset"}
        </button>
      </div>
      <div className="flex gap-2">
        <input
          className="w-12"
          type="number"
          value={rangeMin}
          onChange={(e) => setRangeMin(e.target.valueAsNumber)}
        />
        <Slider
          getAriaLabel={() => "Reference Page Range"}
          min={rangeMin}
          max={rangeMax}
          step={1}
          value={refPage}
          onChange={(_, v) => setRefPage(v)}
          valueLabelDisplay="on"
        />
        <input
          className="w-12"
          type="number"
          value={rangeMax}
          onChange={(e) => setRangeMax(e.target.valueAsNumber)}
        />
      </div>
    </div>
  );
};

const LapNoteForm = ({ note, setNote, ref, onKeyDown }: any) => {
  return (
    <div className="flex gap-2 mb-4">
      <textarea
        className="w-full"
        ref={ref}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

const LapNoteList = ({ lapNotes }: any) => {
  return (
    <div className="flex flex-col gap-2">
      {lapNotes.map((log: LapNote, index: number) => (
        <div key={index} className="flex gap-2">
          <div>{`${log.timestamp.h
            .toString()
            .padStart(2, "0")}:${log.timestamp.m
            .toString()
            .padStart(2, "0")}:${log.timestamp.s
            .toString()
            .padStart(2, "0")}`}</div>
          <div>{log.note}</div>
          <div>{`Page: ${log.refPage}`}</div>
        </div>
      ))}
    </div>
  );
};

const LapNotepad = ({
  isTimerRunning,
  setIsTimerRunning,
  time,
  lapNotes,
  setLapNotes,
}: any) => {
  const [note, setNote] = useState<string>("");
  const [refPage, setRefPage] = useState<number>(1);
  const textareaEl = useRef<HTMLTextAreaElement>(null);

  const onStart = () => {
    setIsTimerRunning(true);
    textareaEl.current?.focus();
  };
  const onStop = () => {
    console.log("stop");
    setIsTimerRunning(false);
    const log = {
      timestamp: time.current,
      note,
      refPage,
    };
    setLapNotes([...lapNotes, log]);
    setNote("");
  };
  const onLap = () => {
    console.log("lap");
    if (note !== "") {
      const log = {
        timestamp: time.current,
        note,
        refPage,
      };
      setLapNotes([...lapNotes, log]);
      setNote("");
      textareaEl.current?.focus();
    }
  };
  const onReset = () => {
    setIsTimerRunning(false);
    time.current = { h: 0, m: 0, s: 0 };
    setLapNotes([]);
    setNote("");
  };

  const onCtrlEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      ((e.ctrlKey && !e.metaKey) || (e.metaKey && !e.ctrlKey)) &&
      e.key === "Enter"
    ) {
      onLap();
    }
  };

  return (
    <div className="p-4 w-full flex flex-col gap-4">
      <Stopwatch time={time} isTimerRunning={isTimerRunning} />
      <ControlPanel
        isTimerRunning={isTimerRunning}
        refPage={refPage}
        setRefPage={setRefPage}
        onStart={onStart}
        onStop={onStop}
        onLap={onLap}
        onReset={onReset}
      />
      <LapNoteForm
        note={note}
        setNote={setNote}
        ref={textareaEl}
        onKeyDown={onCtrlEnter}
      />
      <LapNoteList lapNotes={lapNotes} />
    </div>
  );
};

export default LapNotepad;
