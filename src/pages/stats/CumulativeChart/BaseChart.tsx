import { useMemo, useRef, useState, useEffect } from "react";
import { Temporal } from "temporal-polyfill";
import { LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { curveMonotoneX } from "@visx/curve";
import { generateCumulativeData, CumulativeDataPoint } from "./utils";

interface BaseChartProps {
  books: Book[];
  allLogs: { readingLog: ReadingLog; laps: Lap[] }[];
  periodDays?: number;
  title: string;
  color: string;
  unit: string;
  getMetricValue: (d: CumulativeDataPoint) => number;
}

export const BaseChart = ({
  books,
  allLogs,
  periodDays = 30,
  title,
  color,
  unit,
  getMetricValue,
}: BaseChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const data = useMemo(
    () => generateCumulativeData(books, allLogs, periodDays),
    [books, allLogs, periodDays],
  );

  const height = 300;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleTime<number>({
        domain: [
          data[0].date.toZonedDateTime("UTC").toInstant().epochMilliseconds,
          data[data.length - 1].date.toZonedDateTime("UTC").toInstant()
            .epochMilliseconds,
        ],
        range: [0, innerWidth],
      }),
    [data, innerWidth],
  );

  const yScale = useMemo(() => {
    const values = data.map(getMetricValue);
    const maxValue = Math.max(...values);
    return scaleLinear<number>({
      domain: [0, maxValue * 1.1],
      range: [innerHeight, 0],
      nice: true,
    });
  }, [data, innerHeight, getMetricValue]);

  const getX = (d: CumulativeDataPoint) =>
    xScale(d.date.toZonedDateTime("UTC").toInstant().epochMilliseconds);
  const getY = (d: CumulativeDataPoint) => yScale(getMetricValue(d));

  const xTickValues = useMemo(() => {
    const firstDate = data[0].date
      .toZonedDateTime("UTC")
      .toInstant().epochMilliseconds;
    const lastDate = data[data.length - 1].date
      .toZonedDateTime("UTC")
      .toInstant().epochMilliseconds;
    const midDate = (firstDate + lastDate) / 2;
    return [firstDate, midDate, lastDate];
  }, [data]);

  return (
    <div ref={containerRef}>
      <h2 className="text-xl font-black text-black mb-4">{title}</h2>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke="#e5e7eb"
            strokeDasharray="3,3"
          />

          <LinePath
            data={data}
            x={getX}
            y={getY}
            stroke={color}
            strokeWidth={3}
            curve={curveMonotoneX}
          />

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickValues={xTickValues}
            tickFormat={(value) => {
              const date = Temporal.Instant.fromEpochMilliseconds(
                value as number,
              )
                .toZonedDateTimeISO("UTC")
                .toPlainDate();
              return `${date.month}/${date.day}`;
            }}
            stroke="#000"
            tickStroke="#000"
            tickLabelProps={() => ({
              fill: "#000",
              fontSize: 11,
              fontWeight: 600,
              textAnchor: "middle",
            })}
          />

          <AxisLeft
            scale={yScale}
            stroke="#000"
            tickStroke="#000"
            tickFormat={(value) => `${value}${unit}`}
            tickLabelProps={() => ({
              fill: "#000",
              fontSize: 11,
              fontWeight: 600,
              textAnchor: "end",
              dx: -4,
            })}
          />
        </g>
      </svg>
    </div>
  );
};
