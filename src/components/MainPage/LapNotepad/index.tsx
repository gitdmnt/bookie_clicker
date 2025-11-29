import { useRef, useState } from "react";
import { Temporal } from "temporal-polyfill";
import { LapNote } from "@/types";

import { Stopwatch } from "./Stopwatch";
import { ControlPanel } from "./ControlPanel";
import { LapNoteList } from "./LapNoteList";
import { LapNoteInput } from "./LapNoteInput";

const LapNotepad = ({
  isTimerRunning,
  startTimer,
  stopTimer,
  resetTimer,
  time,
  lapNoteLogs,
  setLapNoteLogs,
}: {
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  time: { h: number; m: number; s: number }; // state object
  lapNoteLogs: any[]; // 型を正しく定義してください
  setLapNoteLogs: (logs: any[]) => void;
}) => {
  const [note, setNote] = useState<string>("");
  const [refPage, setRefPage] = useState<number>(1);
  const textareaEl = useRef<HTMLTextAreaElement>(null);

  const onStart = () => {
    startTimer();
    textareaEl.current?.focus();
    let lapNotes: LapNote[] = [];
    if (note !== "") {
      const log = {
        timestamp: time,
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
    stopTimer();

    let lastLapNoteLog = lapNoteLogs.pop();
    let lapNotes = lastLapNoteLog.lapNotes;
    if (note !== "") {
      const log = {
        timestamp: time,
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
        timestamp: time,
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
    stopTimer();
    resetTimer();
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
        <Stopwatch time={time} />
        <ControlPanel
          isTimerRunning={isTimerRunning}
          refPage={refPage}
          setRefPage={setRefPage}
          onStart={onStart}
          onStop={onStop}
          onLap={onLap}
          onReset={onReset}
        />
        <LapNoteInput
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
