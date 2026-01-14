const TimerControls = ({
  isRunning,
  handlers: { handleStart, handleLap, handleStop, handleReset },
}: {
  isRunning: boolean;
  handlers: {
    handleStart: () => void;
    handleLap: () => void;
    handleStop: () => void;
    handleReset: () => void;
  };
}) => (
  <div className="mt-4 flex flex-wrap gap-2">
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-green-300"
      onClick={handleStart}
      disabled={isRunning}
    >
      Start
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-blue-300"
      onClick={handleLap}
      disabled={!isRunning}
    >
      Lap
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:bg-red-300"
      onClick={handleStop}
      disabled={!isRunning}
    >
      Stop
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-gray-600 text-white"
      onClick={handleReset}
    >
      Reset
    </button>
  </div>
);

export default TimerControls;
