import { useRef, useState } from "react";
import { Temporal } from "temporal-polyfill";
import { LapNote, LapNoteLog, StopwatchTime } from "@/types";
import useInterval from "@/hooks/useInterval";
import reset from "@/assets/icons/reset.svg";
import start from "@/assets/icons/start.svg";
import stop from "@/assets/icons/stop.svg";
import Slider from "@mui/material/Slider";

const temporalToMMSS = (date: Temporal.PlainDateTime | null) => {
  if (!date) return "";
  return `${String(date.hour).padStart(2, "0")}:${String(date.minute).padStart(
    2,
    "0"
  )}`;
};

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

  return <div className="text-5xl m-4">{`${h}:${m}:${s}`}</div>;
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
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-center gap-24">
        <button className="card rounded-full" onClick={handleStartStop}>
          {isTimerRunning ? (
            <img src={stop} className="w-6" />
          ) : (
            <img src={start} className="w-6" />
          )}
        </button>
        <button className="card rounded-full" onClick={handleLapReset}>
          {isTimerRunning ? "Lap" : <img src={reset} className="w-6" />}
        </button>
      </div>
      <div className="flex gap-2 w-full">
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

const LapNoteForm = ({ note, setNote, textareaEl, onKeyDown }: any) => {
  return (
    <div className="flex gap-2 mb-4 w-full">
      <textarea
        className="w-full border-neutral-200 rounded-lg p-2 shadow-inner bg-neutral-100"
        placeholder="Enter your note here..."
        ref={textareaEl}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

const LapNoteList = ({ lapNoteLogs }: any) => {
  return (
    <ul className="flex flex-col gap-4">
      {lapNoteLogs.map((log: LapNoteLog, index: number) => (
        <li key={index} className="flex gap-4 card">
          <div className="flex flex-col text-sm text-neutral-400 gap-1 justify-between">
            {[
              ...new Set(
                [log.startDateTime, log.endDateTime].map((date) =>
                  temporalToMMSS(date)
                )
              ),
            ].map((date, i) => (
              <div key={i} className="text-xs">
                {date}
              </div>
            ))}
          </div>

          <ul className="flex flex-col gap-4 w-full">
            {log.lapNotes.map((note: LapNote, lap: number) => (
              <li key={lap} className="flex flex-col">
                <div>{note.note}</div>
                <div className="flex gap-2 text-xs text-neutral-400 justify-start">
                  <div>{`${note.timestamp.h
                    .toString()
                    .padStart(2, "0")}:${note.timestamp.m
                    .toString()
                    .padStart(2, "0")}:${note.timestamp.s
                    .toString()
                    .padStart(2, "0")}`}</div>
                  <div>{`p.${note.refPage}`}</div>
                </div>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};

const LapNotepad = ({
  isTimerRunning,
  setIsTimerRunning,
  time,
  lapNoteLogs,
  setLapNoteLogs,
}: any) => {
  const [note, setNote] = useState<string>("");
  const [refPage, setRefPage] = useState<number>(1);
  const textareaEl = useRef<HTMLTextAreaElement>(null);

  const onStart = () => {
    setIsTimerRunning(true);
    textareaEl.current?.focus();
    let lapNotes: LapNote[] = [];
    if (note !== "") {
      const log = {
        timestamp: time.current,
        note: note,
        refPage,
      };
      lapNotes = [log];
      setNote("");
    }
    const lapNoteLog = {
      startDateTime: Temporal.Now.plainDateTimeISO(),
      endDateTime: null,
      lapNotes: lapNotes,
    };
    setLapNoteLogs([...lapNoteLogs, lapNoteLog]);
  };
  const onStop = () => {
    setIsTimerRunning(false);

    let lastLapNoteLog = lapNoteLogs.pop();
    let lapNotes = lastLapNoteLog.lapNotes;
    if (note !== "") {
      const log = {
        timestamp: time.current,
        note,
        refPage,
      };
      lapNotes = [...lapNotes, log];
    }
    lastLapNoteLog = {
      ...lastLapNoteLog,
      endDateTime: Temporal.Now.plainDateTimeISO(),
      lapNotes: lapNotes,
    };
    setLapNoteLogs([...lapNoteLogs, lastLapNoteLog]);
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
      let lastLapNoteLog = lapNoteLogs.pop();
      lastLapNoteLog = {
        ...lastLapNoteLog,
        lapNotes: [...lastLapNoteLog.lapNotes, log],
      };
      setLapNoteLogs([...lapNoteLogs, lastLapNoteLog]);
      setNote("");
      textareaEl.current?.focus();
    }
  };
  const onReset = () => {
    setIsTimerRunning(false);
    time.current = { h: 0, m: 0, s: 0 };
    setLapNoteLogs([]);
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
      <div className="card flex flex-col gap-4 justify-center items-center">
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
          textareaEl={textareaEl}
          onKeyDown={onCtrlEnter}
        />
      </div>
      <LapNoteList lapNoteLogs={lapNoteLogs} />
    </div>
  );
};

export default LapNotepad;

