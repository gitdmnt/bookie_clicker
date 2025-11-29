import React, { useEffect, useState } from "react";
import { Temporal } from "temporal-polyfill";
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
    lapNoteLogs[0]?.startDateTime?.toPlainDate() ??
      Temporal.Now.plainDateISO().subtract({
        hours: 1,
      })
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
    setDateStart(lapNoteLogs[0]?.startDateTime?.toPlainDate() ?? dateStart);
    setTimeStart(lapNoteLogs[0]?.startDateTime?.toPlainTime() ?? timeStart);
    setDateEnd(lapNoteLogs.at(-1)?.endDateTime?.toPlainDate() ?? dateEnd);
    setTimeEnd(lapNoteLogs.at(-1)?.endDateTime?.toPlainTime() ?? timeEnd);

    // 毎回1から舐めるのは非効率ではある
    const flattenLapNotes = lapNoteLogs
      .map((l) => l.lapNotes)
      .flat()
      .map((l) => l.refPage);
    setPageStart(Math.min(...flattenLapNotes) ?? pageStart);
    setPageEnd(Math.max(...flattenLapNotes) ?? pageEnd);
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
      <div className="p-4 card w-full flex justify-center flex-shrink-0 overflow-hidden">
        <form
          className="w-72 flex flex-col items-stretch gap-4"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <div className="w-full flex flex-nowrap justify-start items-center text-sm">
              <input
                type="date"
                className="bg-transparent"
                value={dateStart.toString()}
                onChange={(e) =>
                  setDateStart(Temporal.PlainDate.from(e.target.value))
                }
              />
              <input
                type="time"
                className="bg-transparent"
                value={timeStart.toString({ smallestUnit: "minute" })}
                onChange={(e) =>
                  setTimeStart(Temporal.PlainTime.from(e.target.value))
                }
              />
              <div className="ml-6 flex items-stretch">
                <div className="self-center">p.</div>
                <input
                  type="number"
                  placeholder="1"
                  className="bg-transparent w-16"
                  value={pageStart}
                  onChange={(e) => setPageStart(parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="w-full flex flex-nowrap justify-end items-center text-sm">
              <input
                type="date"
                className="bg-transparent"
                value={dateEnd.toString()}
                onChange={(e) =>
                  setDateEnd(Temporal.PlainDate.from(e.target.value))
                }
              />
              <input
                type="time"
                className="bg-transparent"
                value={timeEnd.toString({ smallestUnit: "minute" })}
                onChange={(e) =>
                  setTimeEnd(Temporal.PlainTime.from(e.target.value))
                }
              />
              <div className="ml-6 flex items-stretch">
                <span className="self-center">p.</span>
                <input
                  type="number"
                  placeholder="2"
                  className="bg-transparent w-16"
                  value={pageEnd}
                  onChange={(e) => setPageEnd(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
          <textarea
            className="w-full rounded-lg bg-neutral-100 shadow-inner p-2"
            placeholder="読んだこと"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
            }}
          ></textarea>

          <Slider
            className="w-full"
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
