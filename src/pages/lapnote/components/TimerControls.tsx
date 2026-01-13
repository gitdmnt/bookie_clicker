const TimerControls = ({
  isRunning,
  onStart,
  onLap,
  onStop,
  onReset,
}: {
  isRunning: boolean;
  onStart: () => void;
  onLap: () => void;
  onStop: () => void;
  onReset: () => void;
}) => (
  <div className="mt-4 flex flex-wrap gap-2">
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-green-300"
      onClick={onStart}
      disabled={isRunning}
    >
      Start
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-blue-300"
      onClick={onLap}
      disabled={!isRunning}
    >
      Lap
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:bg-red-300"
      onClick={onStop}
      disabled={!isRunning}
    >
      Stop
    </button>
    <button
      type="button"
      className="px-4 py-2 rounded-lg bg-gray-600 text-white"
      onClick={onReset}
    >
      Reset
    </button>
  </div>
);

export default TimerControls;
