/**
 * pages/lapnote/utils.ts のユニットテスト
 */
import { describe, it, expect } from "vitest";
import { msToTime, formatTime, formatElapsed } from "../utils";

describe("msToTime", () => {
  it("0ms → 0:0:0", () => {
    expect(msToTime(0)).toEqual({ h: 0, m: 0, s: 0 });
  });

  it("999ms → 0:0:0 (切り捨て)", () => {
    expect(msToTime(999)).toEqual({ h: 0, m: 0, s: 0 });
  });

  it("1000ms → 0:0:1", () => {
    expect(msToTime(1000)).toEqual({ h: 0, m: 0, s: 1 });
  });

  it("60000ms → 0:1:0", () => {
    expect(msToTime(60000)).toEqual({ h: 0, m: 1, s: 0 });
  });

  it("3661000ms → 1:1:1", () => {
    expect(msToTime(3661000)).toEqual({ h: 1, m: 1, s: 1 });
  });

  it("86400000ms → 24:0:0", () => {
    expect(msToTime(86400000)).toEqual({ h: 24, m: 0, s: 0 });
  });
});

describe("formatTime", () => {
  it("0:0:0 → '00:00:00'", () => {
    expect(formatTime({ h: 0, m: 0, s: 0 })).toBe("00:00:00");
  });

  it("1:2:3 → '01:02:03'", () => {
    expect(formatTime({ h: 1, m: 2, s: 3 })).toBe("01:02:03");
  });

  it("12:34:56 → '12:34:56'", () => {
    expect(formatTime({ h: 12, m: 34, s: 56 })).toBe("12:34:56");
  });
});

describe("formatElapsed", () => {
  it("0ms → '00:00:00'", () => {
    expect(formatElapsed(0)).toBe("00:00:00");
  });

  it("3661000ms → '01:01:01'", () => {
    expect(formatElapsed(3661000)).toBe("01:01:01");
  });

  it("msToTime + formatTime の合成と一致する", () => {
    const ms = 5400000; // 1h 30m
    expect(formatElapsed(ms)).toBe(formatTime(msToTime(ms)));
  });
});

