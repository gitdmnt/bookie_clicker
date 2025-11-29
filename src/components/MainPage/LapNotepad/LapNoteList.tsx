import { LapNoteLog, LapNote } from "@/types";
import { Temporal } from "temporal-polyfill";

const temporalToMMSS = (date: Temporal.PlainDateTime | null) => {
  if (!date) return "";
  return `${String(date.hour).padStart(2, "0")}:${String(date.minute).padStart(
    2,
    "0"
  )}`;
};

export const LapNoteList = ({ lapNoteLogs }: any) => {
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
