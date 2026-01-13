import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Temporal } from "temporal-polyfill";

import { Stopwatch } from "./Stopwatch";
import { ControlPanel } from "./ControlPanel";
import { LapNoteList } from "./LapNoteList";
import { LapNoteInput } from "./LapNoteInput";

interface LapNotepadProps {
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  time: StopwatchTime;
  lapNoteLogs: LapNoteLog[];
  setLapNoteLogs: Dispatch<SetStateAction<LapNoteLog[]>>;
}

const LapNotepad = ({
  isTimerRunning,
  startTimer,
  stopTimer,
  resetTimer,
  time,
  lapNoteLogs,
  setLapNoteLogs,
}: LapNotepadProps) => {
  const [note, setNote] = useState<string>("");
  const [refPage, setRefPage] = useState<number>(1);
  const textareaEl = useRef<HTMLTextAreaElement>(null);

  const onStart = () => {
    startTimer();
    textareaEl.current?.focus();
    const startNotes = note
      ? [
          {
            timestamp: time,
            note,
            refPage,
          },
        ]
      : [];
    setLapNoteLogs((logs) => [
      ...logs,
      {
        startDateTime: Temporal.Now.plainDateTimeISO(),
        endDateTime: null,
        lapNotes: startNotes,
      },
    ]);
    setNote("");
  };

  const onStop = () => {
    stopTimer();
    const capturedNote = note;
    const capturedRefPage = refPage;
    setLapNoteLogs((logs) => {
      if (logs.length === 0) {
        return logs;
      }
      const lastLog = logs[logs.length - 1];
      const updatedLapNotes = capturedNote
        ? [
            ...lastLog.lapNotes,
            {
              timestamp: time,
              note: capturedNote,
              refPage: capturedRefPage,
            },
          ]
        : lastLog.lapNotes;
      return [
        ...logs.slice(0, -1),
        {
          ...lastLog,
          endDateTime: Temporal.Now.plainDateTimeISO(),
          lapNotes: updatedLapNotes,
        },
      ];
    });
    setNote("");
  };

  const onLap = () => {
    if (!note) {
      return;
    }
    const capturedNote = note;
    const capturedRefPage = refPage;
    setLapNoteLogs((logs) => {
      if (logs.length === 0) {
        return logs;
      }
      const lastLog = logs[logs.length - 1];
      return [
        ...logs.slice(0, -1),
        {
          ...lastLog,
          lapNotes: [
            ...lastLog.lapNotes,
            {
              timestamp: time,
              note: capturedNote,
              refPage: capturedRefPage,
            },
          ],
        },
      ];
    });
    setNote("");
    textareaEl.current?.focus();
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
