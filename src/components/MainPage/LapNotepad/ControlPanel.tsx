import { Slider } from "@mui/material";
import { useState } from "react";
import start from "@/assets/icons/start.svg";
import stop from "@/assets/icons/stop.svg";
import reset from "@/assets/icons/reset.svg";

export const ControlPanel = ({
  isTimerRunning,
  refPage,
  setRefPage,
  onStart,
  onStop,
  onLap,
  onReset,
}: any) => {
  const [rangeMin, setRangeMin] = useState(1);
  const [rangeMax, setRangeMax] = useState(600);

  const handleStartStop = () => {
    if (isTimerRunning) {
      onStop();
    } else {
      onStart();
    }
  };
  const handleLapReset = () => {
    if (isTimerRunning) {
      onLap();
    } else {
      onReset();
    }
  };
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-center gap-24">
        <button className="card rounded-full" onClick={handleStartStop}>
          {isTimerRunning ? (
            <img src={stop} className="w-6" />
          ) : (
            <img src={start} className="w-6" />
          )}
        </button>
        <button className="card rounded-full" onClick={handleLapReset}>
          {isTimerRunning ? "Lap" : <img src={reset} className="w-6" />}
        </button>
      </div>
      <div className="flex gap-2 w-full">
        <input
          className="w-12"
          type="number"
          value={rangeMin}
          onChange={(e) => setRangeMin(e.target.valueAsNumber)}
        />
        <Slider
          getAriaLabel={() => "Reference Page Range"}
          min={rangeMin}
          max={rangeMax}
          step={1}
          value={refPage}
          onChange={(_, v) => setRefPage(v)}
          valueLabelDisplay="on"
        />
        <input
          className="w-12"
          type="number"
          value={rangeMax}
          onChange={(e) => setRangeMax(e.target.valueAsNumber)}
        />
      </div>
    </div>
  );
};
