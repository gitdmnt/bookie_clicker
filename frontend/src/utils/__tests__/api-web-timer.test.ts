/**
 * api-web.ts Timer Operations のユニットテスト
 *
 * テスト対象:
 *   - LocalStorage 状態管理 (load / save / clear)
 *   - 経過時間計算 (computeElapsedMs)
 *   - startTimer / stopTimer / resetTimer
 *   - getTimer / getTimerLaps / timerLap
 *   - onTimerTick (初期化・tick ループ)
 *   - saveTimerSession
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- fetch をグローバルでモック ---
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// import.meta.env のスタブ
vi.stubGlobal("import", {
  meta: { env: { VITE_API_BASE_URL: "http://test-api" } },
});

// モジュールを動的にインポート（各テストで localStorage をリセットした上で使う）
import {
  startTimer,
  stopTimer,
  resetTimer,
  getTimer,
  getTimerLaps,
  timerLap,
  onTimerTick,
  saveTimerSession,
} from "@/utils/api-web";

// ============================================================
// Helpers
// ============================================================

const TIMER_STORAGE_KEY = "lapnote-timer-state";

/** localStorage に直接タイマー状態を書き込む */
const seedTimerState = (partial: Record<string, unknown>) => {
  const state = {
    sessionId: null,
    serverStartTime: null,
    localStartTimestamp: null,
    accumulatedMs: 0,
    isRunning: false,
    laps: [],
    ...partial,
  };
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
};

/** localStorage のタイマー状態を読み込む */
const readTimerState = () => {
  const raw = localStorage.getItem(TIMER_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

/** fetch を成功レスポンスでモックする */
const mockFetchOk = (body: unknown) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as unknown as Response);
};

const mockFetchOkEmpty = () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => "",
  } as unknown as Response);
};

// ============================================================
// Setup / Teardown
// ============================================================

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ============================================================
// LocalStorage 状態管理
// ============================================================

describe("LocalStorage 状態管理", () => {
  it("localStorage が空の場合 getTimer はゼロを返す", async () => {
    const tick = await getTimer();
    expect(tick.h).toBe(0);
    expect(tick.m).toBe(0);
    expect(tick.s).toBe(0);
    expect(tick.isRunning).toBe(false);
  });

  it("保存された状態を getTimer が正しく読み込む", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 3661000, // 1h 1m 1s
      isRunning: false,
    });

    const tick = await getTimer();
    expect(tick.h).toBe(1);
    expect(tick.m).toBe(1);
    expect(tick.s).toBe(1);
    expect(tick.isRunning).toBe(false);
  });

  it("破損した JSON でもクラッシュせずデフォルトを返す", async () => {
    localStorage.setItem(TIMER_STORAGE_KEY, "{{invalid json}}");
    const tick = await getTimer();
    expect(tick.h).toBe(0);
    expect(tick.m).toBe(0);
    expect(tick.s).toBe(0);
  });
});

// ============================================================
// 経過時間計算
// ============================================================

describe("経過時間計算", () => {
  it("停止中は accumulatedMs のみで計算される", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 90000, // 1m 30s
      isRunning: false,
    });

    const tick = await getTimer();
    expect(tick.m).toBe(1);
    expect(tick.s).toBe(30);
  });

  it("実行中は accumulatedMs + 経過分が加算される", async () => {
    const now = Date.now();
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 10000, // 10s accumulated
      localStartTimestamp: now - 5000, // started 5s ago
      isRunning: true,
    });

    const tick = await getTimer();
    // Should be ~15s total (10 + 5)
    expect(tick.s).toBeGreaterThanOrEqual(14);
    expect(tick.s).toBeLessThanOrEqual(16);
    expect(tick.isRunning).toBe(true);
  });

  it("負の elapsed は 0 にクランプされる", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: -1000,
      isRunning: false,
    });

    const tick = await getTimer();
    expect(tick.elapsed).toBe(0);
  });
});

// ============================================================
// startTimer
// ============================================================

describe("startTimer", () => {
  it("新規セッション作成時に状態が保存される", async () => {
    mockFetchOk({
      id: "new-session-1",
      startTime: "2026-02-23T10:00:00Z",
      isRunning: true,
    });

    await startTimer();

    const state = readTimerState();
    expect(state).not.toBeNull();
    expect(state.sessionId).toBe("new-session-1");
    expect(state.isRunning).toBe(true);
    expect(state.laps).toEqual([]);
  });

  it("既に実行中の場合は何もしない", async () => {
    seedTimerState({
      sessionId: "s1",
      isRunning: true,
      localStartTimestamp: Date.now(),
    });

    await startTimer();

    // fetch は呼ばれない
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("停止中のセッションを再開する", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 5000,
      isRunning: false,
    });

    mockFetchOkEmpty(); // resume endpoint

    await startTimer();

    const state = readTimerState();
    expect(state.isRunning).toBe(true);
    expect(state.localStartTimestamp).toBeTruthy();
    // accumulated は維持される
    expect(state.accumulatedMs).toBe(5000);
  });
});

// ============================================================
// stopTimer
// ============================================================

describe("stopTimer", () => {
  it("停止時に経過時間が accumulatedMs に加算される", async () => {
    const now = Date.now();
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 10000,
      localStartTimestamp: now - 5000,
      isRunning: true,
    });

    mockFetchOkEmpty(); // stop endpoint

    await stopTimer();

    const state = readTimerState();
    expect(state.isRunning).toBe(false);
    expect(state.localStartTimestamp).toBeNull();
    // Should be ~15000 (10000 + 5000)
    expect(state.accumulatedMs).toBeGreaterThanOrEqual(14000);
    expect(state.accumulatedMs).toBeLessThanOrEqual(16000);
  });

  it("セッションがない場合は何もしない", async () => {
    await stopTimer();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ============================================================
// resetTimer
// ============================================================

describe("resetTimer", () => {
  it("リセット時に状態がクリアされる", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 50000,
      isRunning: false,
      laps: [{ elapsedMs: 1000, note: "test", refPage: 1 }],
    });

    mockFetchOkEmpty(); // delete endpoint

    await resetTimer();

    const state = readTimerState();
    expect(state).toBeNull();
  });

  it("セッションがなくてもエラーにならない", async () => {
    await resetTimer();
    const state = readTimerState();
    expect(state).toBeNull();
  });
});

// ============================================================
// timerLap / getTimerLaps
// ============================================================

describe("timerLap & getTimerLaps", () => {
  it("Lap が追加され状態に保存される", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 60000,
      isRunning: false,
    });

    const lap = await timerLap("読了メモ", 42);

    expect(lap.note).toBe("読了メモ");
    expect(lap.refPage).toBe(42);
    expect(lap.elapsedMs).toBe(60000);

    const laps = await getTimerLaps();
    expect(laps).toHaveLength(1);
    expect(laps[0].note).toBe("読了メモ");
  });

  it("複数 Lap を追加できる", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 10000,
      isRunning: false,
    });

    await timerLap("1st", 10);
    // 状態を更新して2つ目
    await timerLap("2nd", 20);

    const laps = await getTimerLaps();
    expect(laps).toHaveLength(2);
    expect(laps[0].note).toBe("1st");
    expect(laps[1].note).toBe("2nd");
  });

  it("セッションがない場合でも Lap を追加できる（elapsedMs=0）", async () => {
    const lap = await timerLap("no session", 1);
    expect(lap.elapsedMs).toBe(0);
  });
});

// ============================================================
// onTimerTick
// ============================================================

describe("onTimerTick", () => {
  it("コールバックに初期 tick が送信される", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 7200000, // 2h
      isRunning: false,
    });

    // バックエンドからの復元: null を返す
    mockFetchOk(null);

    const ticks: TimerTick[] = [];
    const unlisten = await onTimerTick((tick) => ticks.push(tick));

    expect(ticks.length).toBeGreaterThanOrEqual(1);
    expect(ticks[0].h).toBe(2);
    expect(ticks[0].m).toBe(0);
    expect(ticks[0].isRunning).toBe(false);

    await unlisten();
  });

  it("サーバーからのセッション復元が動作する", async () => {
    // ローカル状態は空
    mockFetchOk({
      id: "server-session",
      startTime: new Date(Date.now() - 60000).toISOString(), // 1min ago
      isRunning: true,
      durationSec: 60,
    });

    const ticks: TimerTick[] = [];
    const unlisten = await onTimerTick((tick) => ticks.push(tick));

    const state = readTimerState();
    expect(state.sessionId).toBe("server-session");
    expect(state.isRunning).toBe(true);

    await unlisten();
  });

  it("unlisten で tick ループが停止する", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 0,
      localStartTimestamp: Date.now(),
      isRunning: true,
    });

    mockFetchOk(null);

    const ticks: TimerTick[] = [];
    const unlisten = await onTimerTick((tick) => ticks.push(tick));

    const countAfterInit = ticks.length;

    await unlisten();

    // advance time — should not produce more ticks
    vi.advanceTimersByTime(1000);

    expect(ticks.length).toBe(countAfterInit);
  });
});

// ============================================================
// saveTimerSession
// ============================================================

describe("saveTimerSession", () => {
  it("保存成功時に状態がクリアされる", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 3600000,
      isRunning: false,
      laps: [{ elapsedMs: 1000, note: "test", refPage: 1 }],
    });

    mockFetchOk({ readingLogId: "log-1", sessionDurationSec: 3600 });

    const result = await saveTimerSession(9784001234567, 1, 100, 5, [
      { elapsedMs: 1000, note: "test", refPage: 1 },
    ]);

    expect(result.readingLogId).toBe("log-1");
    expect(result.sessionDurationSec).toBe(3600);

    // ローカル状態がクリアされている
    const state = readTimerState();
    expect(state).toBeNull();
  });

  it("セッションがない場合エラーを投げる", async () => {
    await expect(
      saveTimerSession(9784001234567, 1, 100, 5, []),
    ).rejects.toThrow("No active timer session to save");
  });

  it("正しいリクエストボディが送信される", async () => {
    seedTimerState({
      sessionId: "s1",
      accumulatedMs: 0,
      isRunning: false,
    });

    mockFetchOk({ readingLogId: "log-1", sessionDurationSec: 0 });

    await saveTimerSession(9784001234567, 10, 50, 3, [
      { elapsedMs: 1000, note: "first lap", refPage: 10 },
      { elapsedMs: 2000, note: "second lap", refPage: 25 },
    ]);

    // fetch が正しい URL とボディで呼ばれたことを確認
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/timer/sessions/s1/save");
    const body = JSON.parse(opts.body);
    expect(body.isbn).toBe(9784001234567);
    expect(body.firstPage).toBe(10);
    expect(body.lastPage).toBe(50);
    expect(body.rating).toBe(3);
    expect(body.laps).toHaveLength(2);
    expect(body.laps[0].note).toBe("first lap");
  });
});

