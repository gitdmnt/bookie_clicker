import React, { useEffect, useState } from "react";
import { Temporal } from "temporal-polyfill";
import { LapNoteLog } from "@/types";
import { addElement } from "@/utils/api";
import { Slider } from "@mui/material";

interface props {
  isbn: number;
  maxPage: number;
  lapNoteLogs: LapNoteLog[];
  setLapNoteLogs: React.Dispatch<React.SetStateAction<LapNoteLog[]>>;
  loadLogs: () => Promise<void>;
}

const ReadingLogRegistrationForm = ({
  isbn,
  maxPage,
  lapNoteLogs,
  setLapNoteLogs,
  loadLogs,
}: props) => {
  // Start and end date/time inputs
  const [dateStart, setDateStart] = useState(
    lapNoteLogs[0]?.startDateTime?.toPlainDate() ?? Temporal.Now.plainDateISO()
  );
  const [timeStart, setTimeStart] = useState(
    lapNoteLogs[0]?.startDateTime?.toPlainTime() ?? Temporal.Now.plainTimeISO()
  );
  const [dateEnd, setDateEnd] = useState(
    lapNoteLogs.at(-1)?.endDateTime?.toPlainDate() ??
      Temporal.Now.plainDateISO()
  );
  const [timeEnd, setTimeEnd] = useState(
    lapNoteLogs.at(-1)?.endDateTime?.toPlainTime() ??
      Temporal.Now.plainTimeISO()
  );

  const flattenLapNotes = lapNoteLogs
    .map((l) => l.lapNotes)
    .flat()
    .map((l) => l.refPage);
  const [pageStart, setPageStart] = useState(Math.min(...flattenLapNotes) ?? 1);
  const [pageEnd, setPageEnd] = useState(
    Math.max(...flattenLapNotes) ?? maxPage
  );
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);

  // Stateの更新
  useEffect(() => {
    setDateStart(
      lapNoteLogs[0]?.startDateTime?.toPlainDate() ??
        Temporal.Now.plainDateISO()
    );
    setTimeStart(
      lapNoteLogs[0]?.startDateTime?.toPlainTime() ??
        Temporal.Now.plainTimeISO()
    );
    setDateEnd(
      lapNoteLogs.at(-1)?.endDateTime?.toPlainDate() ??
        Temporal.Now.plainDateISO()
    );
    setTimeEnd(
      lapNoteLogs.at(-1)?.endDateTime?.toPlainTime() ??
        Temporal.Now.plainTimeISO()
    );

    // 毎回1から舐めるのは非効率ではある
    const flattenLapNotes = lapNoteLogs
      .map((l) => l.lapNotes)
      .flat()
      .map((l) => l.refPage);
    setPageStart(Math.min(...flattenLapNotes) ?? 1);
    setPageEnd(Math.max(...flattenLapNotes) ?? maxPage);
  }, [lapNoteLogs]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("isbn");
    let readingLogs = [];
    if (lapNoteLogs.length === 0) {
      readingLogs.push({
        id: "",
        isbn,
        time: [
          `${dateStart.toString()}T${timeStart.toString()}`,
          `${dateEnd.toString()}T${timeEnd.toString()}`,
        ],
        page: [pageStart, pageEnd],
        note,
        rating,
      });
    } else {
      let lastPage = pageStart;
      readingLogs = lapNoteLogs.map((log) => {
        const page =
          log.lapNotes.length === 0
            ? [lastPage, lastPage]
            : [
                Math.min(...log.lapNotes.map((l) => l.refPage), lastPage),
                Math.max(...log.lapNotes.map((l) => l.refPage)),
              ];
        lastPage = page[1];
        return {
          id: "",
          isbn,
          time: [
            log.startDateTime.toString() ??
              `${dateStart.toString()}T${timeStart.toString()}`,
            log.endDateTime?.toString() ??
              `${dateEnd.toString()}T${timeEnd.toString()}`,
          ],
          page,
          note: log.lapNotes.map((l) => l.note).join("\n\n"),
          rating: 0,
        };
      });
    }
    readingLogs.forEach(async (log) => {
      console.log("log", log);
      await addElement("readingLog", log);
    });
    setLapNoteLogs([]);
    await loadLogs();
  };

  return (
    <div className="relative mx-4">
      <div className="p-4 card w-full flex-shrink-0 overflow-hidden">
        <p className="mb-2">記録</p>
        <form className="flex flex-wrap gap-4" onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="rounded-lg border border-gray-300 p-2 transition-colors"
              value={dateStart.toString()}
              onChange={(e) =>
                setDateStart(Temporal.PlainDate.from(e.target.value))
              }
            />
            <input
              type="time"
              className="rounded-lg border border-gray-300 p-2 transition-colors"
              value={timeStart.toString({ smallestUnit: "minute" })}
              onChange={(e) =>
                setTimeStart(Temporal.PlainTime.from(e.target.value))
              }
            />
            <div className="flex items-center">
              <span className="p-1">p.</span>
              <input
                type="number"
                placeholder="1"
                className="rounded-lg border border-gray-300 p-2 w-12 transition-colors"
                value={pageStart}
                onChange={(e) => setPageStart(parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="rounded-lg border border-gray-300 p-2 transition-colors"
              value={dateEnd.toString()}
              onChange={(e) =>
                setDateEnd(Temporal.PlainDate.from(e.target.value))
              }
            />
            <input
              type="time"
              className="rounded-lg border border-gray-300 p-2 transition-colors"
              value={timeEnd.toString({ smallestUnit: "minute" })}
              onChange={(e) =>
                setTimeEnd(Temporal.PlainTime.from(e.target.value))
              }
            />
            <div className="flex items-center">
              <span className="p-1">p.</span>
              <input
                type="number"
                placeholder="2"
                className="rounded-lg border border-gray-300 p-2 w-12 transition-colors"
                value={pageEnd}
                onChange={(e) => setPageEnd(parseInt(e.target.value))}
              />
            </div>
          </div>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-2 transition-colors"
            placeholder="読んだこと"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
            }}
          ></textarea>
          <Slider
            className="w-full mx-4"
            value={rating}
            min={1}
            max={5}
            step={1}
            marks
            valueLabelDisplay="on"
            onChange={(_, newValue) => {
              setRating(newValue as number);
            }}
          />
          <div className="flex justify-center w-full">
            <button
              type="submit"
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none"
            >
              登録
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReadingLogRegistrationForm;

