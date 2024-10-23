import { Slider } from "@mui/material";

export const RangeSlider = (props: any) => {
  const { max, min, value, onChange } = props;

  return (
    <div className="Slider">
      <input
        type="number"
        value={value[0]}
        onChange={(e) => onChange([e.target.value, value[1]])}
        min={min}
        max={max}
      />
      <Slider
        getAriaLabel={() => "ページ"}
        value={value}
        onChange={(_, v) => onChange(v as number[])}
        valueLabelDisplay="auto"
        max={max}
        min={min}
      />
      <input
        type="number"
        value={value[1]}
        onChange={(e) => onChange([value[0], e.target.value])}
        min={min}
        max={max}
      />
    </div>
  );
};

export const StarSlider = (props: any) => {
  const { max, min, value, onChange } = props;
  return (
    <div className="Slider">
      <Slider
        getAriaLabel={() => "Rating"}
        value={value}
        onChange={(_, v) => onChange(v as number)}
        valueLabelDisplay="auto"
        step={0.1}
        max={max}
        min={min}
      />
    </div>
  );
};

