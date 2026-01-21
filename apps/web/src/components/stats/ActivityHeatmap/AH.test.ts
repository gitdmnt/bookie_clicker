import { describe, it, expect } from "vitest";
import { Temporal } from "temporal-polyfill";
import { generateActivityData } from "./index";

describe("ActivityHeatmap utilities", () => {
  it("generateActivityDataが正しく読書時間を集計する", () => {
    const today = Temporal.Now.plainDateISO();
    const date1 = today.subtract({ days: 10 }).toString();
    const date2 = today.subtract({ days: 5 }).toString();

    const logs: { readingLog: ReadingLog; laps: Lap[] }[] = [
      [date1, 50],
      [date1, 70],
      [date2, 10],
    ].map(([date, dur]) => ({
      readingLog: {
        isbn: 0,
        id: "test-log",
        page: [0, 0],
        rating: 0,
        createdAt: Temporal.PlainDateTime.from(date + "T12:00:00"),
        updatedAt: Temporal.PlainDateTime.from(date + "T12:00:00"),
        sessionDurationSec: (dur as number) * 60,
      } as ReadingLog,
      laps: [],
    }));

    const result = generateActivityData(logs);
    const day1 = result.find((d) => d.date === date1);
    const day2 = result.find((d) => d.date === date2);

    expect(day1?.dur).toBe(120);
    expect(day2?.dur).toBe(10);
  });
});
