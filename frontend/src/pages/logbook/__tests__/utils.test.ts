/**
 * pages/logbook/utils.ts のユニットテスト
 */
import { describe, it, expect } from "vitest";
import { Temporal } from "temporal-polyfill";
import {
  formatTime,
  formatDateTime,
  formatReadingTime,
  getHeatmapColor,
  generateActivityData,
  groupByWeeks,
  sortLaps,
  generateReadingPaceData,
  generateSessionFrequencyData,
} from "../utils";

// ============================================================
// ヘルパー
// ============================================================

const dt = (s: string) => Temporal.PlainDateTime.from(s);

const mkLog = (
  page: [number, number],
  sec: number,
  created: string,
  laps: Lap[] = [],
) => ({
  readingLog: {
    id: "log-1",
    isbn: 1,
    page,
    sessionDurationSec: sec,
    rating: 5,
    createdAt: dt(created),
  } as ReadingLog,
  laps,
});

// ============================================================
// formatTime
// ============================================================

describe("formatTime", () => {
  it("0秒 → '0:00'", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("61秒 → '1:01'", () => {
    expect(formatTime(61)).toBe("1:01");
  });

  it("3600秒 → '60:00'", () => {
    expect(formatTime(3600)).toBe("60:00");
  });
});

// ============================================================
// formatDateTime
// ============================================================

describe("formatDateTime", () => {
  it("undefinedで '日時不明' を返す", () => {
    expect(formatDateTime(undefined)).toBe("日時不明");
  });

  it("正常な日時をフォーマットする", () => {
    const result = formatDateTime(dt("2025-06-15T09:05"));
    expect(result).toBe("2025年6月15日 09:05");
  });

  it("午後の時刻もフォーマットする", () => {
    const result = formatDateTime(dt("2025-12-31T23:59"));
    expect(result).toBe("2025年12月31日 23:59");
  });
});

// ============================================================
// formatReadingTime
// ============================================================

describe("formatReadingTime", () => {
  it("0秒 → '0m'", () => {
    expect(formatReadingTime(0)).toBe("0m");
  });

  it("59分 → '59m'", () => {
    expect(formatReadingTime(3540)).toBe("59m");
  });

  it("1時間30分 → '1h 30m'", () => {
    expect(formatReadingTime(5400)).toBe("1h 30m");
  });

  it("1時間ちょうど → '1h 0m'", () => {
    expect(formatReadingTime(3600)).toBe("1h 0m");
  });
});

// ============================================================
// getHeatmapColor
// ============================================================

describe("getHeatmapColor", () => {
  it("0 → bg-gray-100", () => {
    expect(getHeatmapColor(0)).toBe("bg-gray-100");
  });

  it("1 → bg-nb-pink-200", () => {
    expect(getHeatmapColor(1)).toBe("bg-nb-pink-200");
  });

  it("2 → bg-nb-pink-400", () => {
    expect(getHeatmapColor(2)).toBe("bg-nb-pink-400");
  });

  it("3以上 → bg-nb-pink-600", () => {
    expect(getHeatmapColor(3)).toBe("bg-nb-pink-600");
    expect(getHeatmapColor(10)).toBe("bg-nb-pink-600");
  });
});

// ============================================================
// sortLaps
// ============================================================

describe("sortLaps", () => {
  const laps: Lap[] = [
    {
      elapsedMs: 1000,
      note: "A",
      refPage: 30,
      createdAt: dt("2025-06-02T10:00"),
    },
    {
      elapsedMs: 2000,
      note: "B",
      refPage: 10,
      createdAt: dt("2025-06-01T10:00"),
    },
    {
      elapsedMs: 3000,
      note: "C",
      refPage: 20,
      createdAt: dt("2025-06-03T10:00"),
    },
  ];

  it("日付順（降順）でソートする", () => {
    const sorted = sortLaps(laps, "date");
    expect(sorted[0].note).toBe("C");
    expect(sorted[1].note).toBe("A");
    expect(sorted[2].note).toBe("B");
  });

  it("ページ順（昇順）でソートする", () => {
    const sorted = sortLaps(laps, "page");
    expect(sorted[0].refPage).toBe(10);
    expect(sorted[1].refPage).toBe(20);
    expect(sorted[2].refPage).toBe(30);
  });

  it("空配列は空配列を返す", () => {
    expect(sortLaps([], "date")).toEqual([]);
  });

  it("元の配列を変更しない（イミュータブル）", () => {
    const original = [...laps];
    sortLaps(laps, "date");
    expect(laps).toEqual(original);
  });
});

// ============================================================
// generateReadingPaceData
// ============================================================

describe("generateReadingPaceData", () => {
  it("空配列は空配列を返す", () => {
    expect(generateReadingPaceData([])).toEqual([]);
  });

  it("同じ週のログはページ数を合算する", () => {
    // 2025-06-09 は月曜日
    const logs = [
      mkLog([1, 30], 600, "2025-06-09T10:00"),
      mkLog([30, 50], 600, "2025-06-10T10:00"),
    ];
    const result = generateReadingPaceData(logs);
    expect(result).toHaveLength(1);
    expect(result[0].pages).toBe(49); // (30-1) + (50-30)
  });
});

// ============================================================
// generateSessionFrequencyData
// ============================================================

describe("generateSessionFrequencyData", () => {
  it("空配列は空配列を返す", () => {
    expect(generateSessionFrequencyData([])).toEqual([]);
  });

  it("月ごとにセッション数を集計する", () => {
    const logs = [
      mkLog([1, 10], 600, "2025-06-01T10:00"),
      mkLog([10, 20], 600, "2025-06-15T10:00"),
      mkLog([20, 30], 600, "2025-07-01T10:00"),
    ];
    const result = generateSessionFrequencyData(logs);
    const junData = result.find((d) => d.month.includes("6"));
    const julData = result.find((d) => d.month.includes("7"));
    expect(junData?.count).toBe(2);
    expect(julData?.count).toBe(1);
  });
});

// ============================================================
// generateActivityData / groupByWeeks
// ============================================================

describe("generateActivityData", () => {
  it("ログがなくても365日分のデータを返す", () => {
    const result = generateActivityData([]);
    expect(result).toHaveLength(365);
    expect(result.every((d) => d.count === 0)).toBe(true);
  });
});

describe("groupByWeeks", () => {
  it("空配列は空配列を返す", () => {
    expect(groupByWeeks([])).toEqual([]);
  });

  it("各週は7要素", () => {
    const data = generateActivityData([]);
    const weeks = groupByWeeks(data);
    weeks.forEach((week) => {
      expect(week).toHaveLength(7);
    });
  });
});

