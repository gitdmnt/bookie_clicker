import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

const IconPlay = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-7 h-7"
  >
    <path d="M5.25 4.5v15l14-7.5-14-7.5z" />
  </svg>
);
const IconStop = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-7 h-7"
  >
    <path d="M6 6h12v12H6z" />
  </svg>
);

const IconPen = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-7 h-7"
  >
    <path
      d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TimerControls = ({
  isRunning,
  handlers: { handleStart, handleStop },
  onOpenForm,
  isFormOpen,
}: {
  isRunning: boolean;
  handlers: {
    handleStart: () => void;
    handleStop: () => void;
  };
  onOpenForm: () => void;
  isFormOpen: boolean;
}) => (
  <div className="flex flex-row items-center justify-between gap-6">
    <motion.div
      whileHover={{ rotate: isRunning ? 0 : 5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {isRunning ? (
        <Button
          type="button"
          variant="danger"
          className="rounded-full w-20 h-20 text-xl flex items-center justify-center p-0 shadow-brutal-lg"
          onClick={handleStop}
          aria-label="Stop timer"
        >
          <IconStop />
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          className="rounded-full w-20 h-20 text-xl flex items-center justify-center p-0 shadow-brutal-lg"
          onClick={handleStart}
          aria-label="Start timer"
        >
          <IconPlay />
        </Button>
      )}
    </motion.div>

    {!isFormOpen && (
      <Button
        type="button"
        variant="secondary"
        onClick={onOpenForm}
        disabled={!isRunning}
        aria-label="Add note"
        className="w-20 h-20 rounded-full flex items-center justify-center p-0 shadow-brutal-lg"
      >
        <IconPen />
      </Button>
    )}
  </div>
);
