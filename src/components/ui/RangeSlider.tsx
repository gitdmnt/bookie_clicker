import { useState, useRef, useEffect } from "react";

interface RangeSliderProps {
  min: number;
  max: number;
  valueStart: number;
  valueEnd: number;
  onChangeStart: (value: number) => void;
  onChangeEnd: (value: number) => void;
}

interface SingleSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  color?: "pink" | "yellow";
}

export const SingleSlider = ({
  min,
  max,
  value,
  onChange,
  color = "pink",
}: SingleSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const getValueFromPosition = (clientX: number): number => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    return Math.round(min + percentage * (max - min));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const newValue = getValueFromPosition(e.clientX);
    onChange(newValue);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromPosition(e.clientX);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;
  const thumbColor = color === "yellow" ? "bg-nb-yellow" : "bg-nb-pink-500";
  const thumbHoverColor =
    color === "yellow" ? "hover:bg-nb-yellow/80" : "hover:bg-nb-pink-600";
  const activeColor = color === "yellow" ? "bg-nb-yellow/30" : "bg-nb-pink-200";

  return (
    <div
      className="relative h-3 cursor-pointer"
      ref={trackRef}
      onMouseDown={handleMouseDown}
    >
      {/* Background track */}
      <div className="absolute inset-0 rounded-full border-3 border-black bg-white shadow-brutal-sm" />

      {/* Active range */}
      <div
        className={`absolute top-0 h-3 rounded-l-full border-y-3 border-l-3 border-black pointer-events-none ${activeColor}`}
        style={{
          width: `${percentage}%`,
        }}
      />

      {/* Thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${thumbColor} border-3 border-black cursor-grab active:cursor-grabbing shadow-brutal-sm ${thumbHoverColor} transition-colors z-10`}
        style={{
          left: `${percentage}%`,
          transform: `translate(-50%, -50%)`,
        }}
      />
    </div>
  );
};

export const RangeSlider = ({
  min,
  max,
  valueStart,
  valueEnd,
  onChangeStart,
  onChangeEnd,
}: RangeSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);

  const getValueFromPosition = (clientX: number): number => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    return Math.round(min + percentage * (max - min));
  };

  const handleMouseDown = (thumb: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(thumb);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const value = getValueFromPosition(e.clientX);

      if (dragging === "start") {
        if (value <= valueEnd) {
          onChangeStart(value);
        }
      } else {
        if (value >= valueStart) {
          onChangeEnd(value);
        }
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, min, max, valueStart, valueEnd, onChangeStart, onChangeEnd]);

  const startPercentage = ((valueStart - min) / (max - min)) * 100;
  const endPercentage = ((valueEnd - min) / (max - min)) * 100;

  return (
    <div className="relative h-3 cursor-pointer" ref={trackRef}>
      {/* Background track */}
      <div className="absolute inset-0 rounded-full border-3 border-black bg-white shadow-brutal-sm" />

      {/* Active range */}
      <div
        className="absolute top-0 h-3 rounded-full bg-nb-pink-200 border-y-3 border-black pointer-events-none"
        style={{
          left: `${startPercentage}%`,
          right: `${100 - endPercentage}%`,
        }}
      />

      {/* Start thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-nb-pink-500 border-3 border-black cursor-grab active:cursor-grabbing shadow-brutal-sm hover:bg-nb-pink-600 transition-colors z-10"
        style={{
          left: `${startPercentage}%`,
          transform: `translate(-50%, -50%)`,
        }}
        onMouseDown={handleMouseDown("start")}
      />

      {/* End thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-nb-pink-500 border-3 border-black cursor-grab active:cursor-grabbing shadow-brutal-sm hover:bg-nb-pink-600 transition-colors z-10"
        style={{
          left: `${endPercentage}%`,
          transform: `translate(-50%, -50%)`,
        }}
        onMouseDown={handleMouseDown("end")}
      />
    </div>
  );
};
