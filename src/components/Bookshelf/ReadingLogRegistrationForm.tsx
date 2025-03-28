import React, { useState } from "react";
import { Temporal } from "temporal-polyfill";
import { ReadingLog } from "@/types";
import { addElement } from "@/utils/api";

interface ReadingLogRegistrationFormProps {
  isbn: number;
  maxPage: number;
  loadLogs: () => Promise<void>;
}

const ReadingLogRegistrationForm: React.FC<ReadingLogRegistrationFormProps> = ({
  isbn,
  maxPage,
  loadLogs,
}) => {
  const totalCards = 2;
  const [activeCard, setActiveCard] = useState(0);

  // Start and end date/time inputs
  const [dateStart, setDateStart] = useState(Temporal.Now.plainDateISO());
  const [timeStart, setTimeStart] = useState(Temporal.Now.plainTimeISO());
  const [dateEnd, setDateEnd] = useState(Temporal.Now.plainDateISO());
  const [timeEnd, setTimeEnd] = useState(Temporal.Now.plainTimeISO());
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(maxPage);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);

  const nextCard = () => setActiveCard((prev) => (prev + 1) % totalCards);
  const prevCard = () =>
    setActiveCard((prev) => (prev - 1 + totalCards) % totalCards);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const readingLog: ReadingLog = {
      id: "",
      isbn,
      time: [
        `${dateStart.toString()}T${timeStart.toString()}`,
        `${dateEnd.toString()}T${timeEnd.toString()}`,
      ],
      page: [pageStart, pageEnd],
      note,
      rating,
    };
    console.log("Submitting reading log:", readingLog);
    await addElement("readingLog", readingLog);
    await loadLogs();
  };

  return (
    <div className="relative">
      <div className="m-4">
        {/* Card slider */}
        <div
          className="flex gap-3 transition-transform duration-300 ease-in-out w-full"
          style={{
            transform: `translateX(calc(-${activeCard * 100}% - ${
              activeCard * 0.75
            }rem))`,
          }}
        >
          {/* Card 1: Reading Log Registration Form */}
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
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                className="w-full"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
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
          {/* Card 2: Placeholder for “読む” (Reading) if needed */}
          <div className="p-4 card w-full flex-shrink-0">
            <p>読む</p>
          </div>
        </div>
        {/* Arrow Navigation */}
        <div className="pointer-events-none flex justify-between absolute top-1/2 left-0 right-0">
          <button
            onClick={prevCard}
            className="pointer-events-auto bg-white bg-opacity-70 rounded-full p-2 shadow-md hover:bg-opacity-80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextCard}
            className="pointer-events-auto bg-white bg-opacity-70 rounded-full p-2 shadow-md hover:bg-opacity-80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Indicator */}
      <div className="flex justify-center mt-2">
        {[...Array(totalCards)].map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveCard(index)}
            className={`h-2 w-2 mx-1 rounded-full ${
              activeCard === index ? "bg-white" : "bg-white bg-opacity-70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ReadingLogRegistrationForm;

