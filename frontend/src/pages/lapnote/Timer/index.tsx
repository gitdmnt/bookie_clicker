import Card from "@/components/ui/Card";
import { TimerControls } from "./TimerControls";
import { StateDot } from "./StateDot";
import { BookTitleBar } from "./BookTitleBar";
import { BookInfoModal } from "./BookInfoModal";
import { formatTime } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export const Timer = ({
  states,
  laps,
  book,
  handlers,
  onOpenForm,
  isFormOpen,
}: {
  states: { time: StopwatchTime; isRunning: boolean };
  laps: Lap[];
  book: Book | null;
  handlers: {
    handleStart: () => void;
    handleStop: () => void;
  };
  onOpenForm: () => void;
  isFormOpen: boolean;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastLap = laps.length ? laps[laps.length - 1] : undefined;

  const msToTime = (elapsedMs: number): StopwatchTime => {
    const sTotal = Math.floor(elapsedMs / 1000);
    const h = Math.floor(sTotal / 3600);
    const m = Math.floor((sTotal % 3600) / 60);
    const s = sTotal % 60;
    return { h, m, s };
  };

  return (
    <Card variant={states.isRunning ? "pink" : "default"}>
      <div className="flex flex-col gap-2">
        <BookTitleBar book={book} onInfoClick={() => setIsModalOpen(true)} />

        <div className="flex items-center justify-between">
          <StateDot isRunning={states.isRunning} />
          <div className="text-sm font-semibold text-gray-700">
            {lastLap
              ? `Last lap: ${formatTime(msToTime(lastLap.elapsedMs))}`
              : "No laps yet"}
          </div>
        </div>

        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${states.time.h}-${states.time.m}-${states.time.s}`}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.8 }}
              role="status"
              aria-live="polite"
              className="text-6xl font-mono font-black tracking-tight text-black"
            >
              {formatTime(states.time)}
            </motion.div>
          </AnimatePresence>
        </div>

        <TimerControls
          isRunning={states.isRunning}
          handlers={handlers}
          onOpenForm={onOpenForm}
          isFormOpen={isFormOpen}
        />
      </div>
      <BookInfoModal
        book={book}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Card>
  );
};
