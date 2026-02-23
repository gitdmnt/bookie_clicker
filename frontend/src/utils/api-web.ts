/**
 * Web (Cloudflare Workers) バックエンドAPI実装
 */
import { Temporal } from "temporal-polyfill";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

// ============================================================
// Helper Functions
// ============================================================

const fetchWithCredentials = (
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> => {
  const headers = new Headers(init.headers);
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  const text = await response.text();
  if (response.status === 204 || text.length === 0) {
    // No Content
    return undefined as unknown as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error("Failed to parse JSON response");
  }
};

// ============================================================
// Book API
// ============================================================

export const searchBooksByISBN = async (isbn: string): Promise<Book[]> => {
  const digits = isbn.replace(/\D/g, "");
  if (!digits) {
    return [];
  }

  try {
    const response = await fetchWithCredentials(
      `${API_BASE}/api/books/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn: digits }),
      },
    );
    const books = await handleResponse<Book[]>(response);
    return books.map((book) => ({
      ...book,
      pageCount: book.pageCount,
      seriesTitle: book.seriesTitle ?? undefined,
      year: book.year || undefined,
      createdAt: Temporal.PlainDateTime.from(book.createdAt),
    }));
  } catch (error) {
    console.error("Error searching books via backend", error);
    return [];
  }
};

export const scanBarcodeISBN = async (_imageData: string): Promise<Book[]> => {
  // Web版ではバーコードスキャン機能は未実装
  // フロントエンドで直接実装するか、サーバーサイドで実装する必要がある
  console.warn("Barcode scanning is not implemented for web backend");
  throw new Error("バーコードスキャン機能はWeb版では未対応です");
};

// ============================================================
// Database Operations
// ============================================================

export const addBook = async (book: Book): Promise<void> => {
  const response = await fetchWithCredentials(`${API_BASE}/api/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });
  await handleResponse<void>(response);
};

export const addReadingLog = async (readingLog: ReadingLog): Promise<void> => {
  const response = await fetchWithCredentials(`${API_BASE}/api/reading-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readingLog),
  });
  await handleResponse<void>(response);
};

export const addLaps = async (
  readingLog: ReadingLog,
  laps: Lap[],
): Promise<void> => {
  const response = await fetchWithCredentials(`${API_BASE}/api/laps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ readingLog, laps }),
  });
  await handleResponse<void>(response);
};

export const selectBooks = async (query: Query): Promise<Book[]> => {
  const params = new URLSearchParams();
  if (query.isbn) params.set("isbn", query.isbn.toString());

  const response = await fetchWithCredentials(
    `${API_BASE}/api/books?${params.toString()}`,
  );
  const books = await handleResponse<Book[]>(response);
  return books;
};

export const selectReadingLogs = async (
  query: Query,
): Promise<ReadingLog[]> => {
  const params = new URLSearchParams();
  if (query.isbn) params.set("isbn", query.isbn.toString());
  if (query.id) params.set("id", query.id);

  const response = await fetchWithCredentials(
    `${API_BASE}/api/reading-logs?${params.toString()}`,
  );
  const readingLogs = await handleResponse<ReadingLog[]>(response);
  return readingLogs.map((log) => ({
    ...log,
    createdAt: Temporal.PlainDateTime.from(log.createdAt),
  }));
};

export const selectLaps = async (readingLog: ReadingLog): Promise<Lap[]> => {
  const params = new URLSearchParams();
  if (readingLog.id) params.set("reading_log_id", readingLog.id);

  const response = await fetchWithCredentials(
    `${API_BASE}/api/laps?${params.toString()}`,
  );
  const laps = await handleResponse<Lap[]>(response);
  return laps.map((lap) => ({
    ...lap,
    createdAt: lap.createdAt
      ? Temporal.PlainDateTime.from(lap.createdAt)
      : undefined,
  }));
};

export const deleteBooks = async (query: Query): Promise<void> => {
  const params = new URLSearchParams();
  if (query.isbn) params.set("isbn", query.isbn.toString());

  const response = await fetchWithCredentials(
    `${API_BASE}/api/books?${params.toString()}`,
    {
      method: "DELETE",
    },
  );
  await handleResponse<void>(response);
};

export const deleteReadingLogs = async (query: Query): Promise<void> => {
  const params = new URLSearchParams();
  if (query.id) params.set("id", query.id);

  const response = await fetchWithCredentials(
    `${API_BASE}/api/reading-logs?${params.toString()}`,
    { method: "DELETE" },
  );
  await handleResponse<void>(response);
};

export const deleteLap = async (id: String): Promise<void> => {
  const response = await fetchWithCredentials(`${API_BASE}/api/laps/${id}`, {
    method: "DELETE",
  });
  await handleResponse<void>(response);
};

export const exportDatabase = async (): Promise<string> => {
  const response = await fetchWithCredentials(`${API_BASE}/api/export`);
  const result = await handleResponse<{ data: string }>(response);
  return result.data;
};

// ============================================================
// Timer Operations
// ============================================================

// --- LocalStorage helpers for timer state ---

const TIMER_STORAGE_KEY = "lapnote-timer-state";

interface TimerLocalState {
  sessionId: string | null;
  serverStartTime: string | null; // ISO 8601 from backend
  localStartTimestamp: number | null; // Date.now() at start
  accumulatedMs: number; // accumulated ms from previous start/stop cycles
  isRunning: boolean;
  laps: Lap[];
}

const defaultTimerState: TimerLocalState = {
  sessionId: null,
  serverStartTime: null,
  localStartTimestamp: null,
  accumulatedMs: 0,
  isRunning: false,
  laps: [],
};

const loadTimerState = (): TimerLocalState => {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return { ...defaultTimerState };
    return JSON.parse(raw) as TimerLocalState;
  } catch {
    return { ...defaultTimerState };
  }
};

const saveTimerState = (state: TimerLocalState) => {
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
};

const clearTimerState = () => {
  localStorage.removeItem(TIMER_STORAGE_KEY);
};

// internal interval id for tick
let _tickInterval: ReturnType<typeof setInterval> | null = null;
let _tickCallback: ((tick: TimerTick) => void) | null = null;

const startTickLoop = () => {
  stopTickLoop();
  _tickInterval = setInterval(() => {
    if (!_tickCallback) return;
    const state = loadTimerState();
    const elapsed = computeElapsedMs(state);
    const totalSec = Math.floor(elapsed / 1000);
    _tickCallback({
      elapsed,
      h: Math.floor(totalSec / 3600),
      m: Math.floor((totalSec % 3600) / 60),
      s: totalSec % 60,
      isRunning: state.isRunning,
    });
  }, 200);
};

const stopTickLoop = () => {
  if (_tickInterval !== null) {
    clearInterval(_tickInterval);
    _tickInterval = null;
  }
};

const computeElapsedMs = (state: TimerLocalState): number => {
  let elapsed = state.accumulatedMs;
  if (state.isRunning && state.localStartTimestamp !== null) {
    elapsed += Date.now() - state.localStartTimestamp;
  }
  return Math.max(elapsed, 0);
};

export const startTimer = async (): Promise<void> => {
  const state = loadTimerState();

  // If already running, ignore
  if (state.isRunning && state.sessionId) return;

  // If we have a stopped session, resume it
  if (state.sessionId && !state.isRunning) {
    try {
      await fetchWithCredentials(
        `${API_BASE}/api/timer/sessions/${state.sessionId}/resume`,
        { method: "PATCH" },
      );
    } catch (e) {
      console.error("Failed to resume session on backend", e);
    }
    state.localStartTimestamp = Date.now();
    state.isRunning = true;
    saveTimerState(state);
    startTickLoop();
    return;
  }

  // Create a new session
  try {
    const response = await fetchWithCredentials(
      `${API_BASE}/api/timer/sessions`,
      { method: "POST" },
    );
    const data = await handleResponse<TimerSessionResponse>(response);

    const newState: TimerLocalState = {
      sessionId: data.id,
      serverStartTime: data.startTime,
      localStartTimestamp: Date.now(),
      accumulatedMs: 0,
      isRunning: true,
      laps: [],
    };
    saveTimerState(newState);
    startTickLoop();
  } catch (error) {
    console.error("Failed to start timer session", error);
    throw error;
  }
};

export const stopTimer = async (): Promise<void> => {
  const state = loadTimerState();
  if (!state.sessionId) return;

  // Accumulate elapsed
  if (state.isRunning && state.localStartTimestamp !== null) {
    state.accumulatedMs += Date.now() - state.localStartTimestamp;
  }
  state.localStartTimestamp = null;
  state.isRunning = false;
  saveTimerState(state);
  stopTickLoop();

  // Notify backend
  try {
    await fetchWithCredentials(
      `${API_BASE}/api/timer/sessions/${state.sessionId}/stop`,
      { method: "PATCH" },
    );
  } catch (e) {
    console.error("Failed to stop session on backend", e);
  }

  // Emit one final tick
  if (_tickCallback) {
    const elapsed = computeElapsedMs(state);
    const totalSec = Math.floor(elapsed / 1000);
    _tickCallback({
      elapsed,
      h: Math.floor(totalSec / 3600),
      m: Math.floor((totalSec % 3600) / 60),
      s: totalSec % 60,
      isRunning: false,
    });
  }
};

export const resetTimer = async (): Promise<void> => {
  stopTickLoop();

  const state = loadTimerState();
  if (state.sessionId) {
    // Delete on backend
    try {
      await fetchWithCredentials(`${API_BASE}/api/timer/sessions`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to reset session on backend", e);
    }
  }

  clearTimerState();

  // Emit zero tick
  if (_tickCallback) {
    _tickCallback({ elapsed: 0, h: 0, m: 0, s: 0, isRunning: false });
  }
};

export const getTimer = async (): Promise<TimerTick> => {
  const state = loadTimerState();
  const elapsed = computeElapsedMs(state);
  const totalSec = Math.floor(elapsed / 1000);
  return {
    elapsed,
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    isRunning: state.isRunning,
  };
};

export const getTimerLaps = async (): Promise<Lap[]> => {
  const state = loadTimerState();
  return state.laps;
};

export const timerLap = async (note: string, refPage: number): Promise<Lap> => {
  const state = loadTimerState();
  const elapsedMs = computeElapsedMs(state);

  const lap: Lap = {
    elapsedMs,
    note,
    refPage,
  };

  state.laps = [...state.laps, lap];
  saveTimerState(state);

  return lap;
};

export const onTimerTick = async (
  cb: (tick: TimerTick) => void,
): Promise<() => Promise<void>> => {
  _tickCallback = cb;

  // Restore state: if running, restart tick loop
  const state = loadTimerState();

  // Attempt to restore from backend on init
  try {
    const response = await fetchWithCredentials(
      `${API_BASE}/api/timer/sessions/current`,
    );
    const serverSession = await handleResponse<TimerSessionResponse | null>(
      response,
    );

    if (serverSession && serverSession.id) {
      // Server has an active session
      if (!state.sessionId || state.sessionId !== serverSession.id) {
        // Local state is out of sync — use server as source of truth
        const serverStart = new Date(serverSession.startTime).getTime();
        const now = Date.now();

        const restoredState: TimerLocalState = {
          sessionId: serverSession.id,
          serverStartTime: serverSession.startTime,
          localStartTimestamp: serverSession.isRunning ? now : null,
          accumulatedMs: serverSession.isRunning
            ? now - serverStart
            : (serverSession.durationSec ?? 0) * 1000,
          isRunning: serverSession.isRunning,
          laps: state.laps.length > 0 ? state.laps : [],
        };
        // For running sessions restored from server, the accumulated approach:
        // we set localStartTimestamp=now and accumulatedMs=0, but compute elapsed
        // from the original server start time so the display is correct.
        if (serverSession.isRunning) {
          restoredState.accumulatedMs = 0;
          restoredState.localStartTimestamp = serverStart;
        }
        saveTimerState(restoredState);
      }
    }
  } catch (e) {
    console.warn("Failed to restore timer session from backend", e);
  }

  // Read (possibly updated) state
  const latestState = loadTimerState();
  if (latestState.isRunning) {
    startTickLoop();
  }

  // Emit initial tick
  const elapsed = computeElapsedMs(latestState);
  const totalSec = Math.floor(elapsed / 1000);
  cb({
    elapsed,
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    isRunning: latestState.isRunning,
  });

  return async () => {
    _tickCallback = null;
    stopTickLoop();
  };
};

// ============================================================
// Timer Session Save (used by handleSave in useLapnoteTimer)
// ============================================================

export const saveTimerSession = async (
  isbn: number,
  firstPage: number,
  lastPage: number,
  rating: number,
  laps: Lap[],
): Promise<TimerSessionSaveResponse> => {
  const state = loadTimerState();
  if (!state.sessionId) {
    throw new Error("No active timer session to save");
  }

  const response = await fetchWithCredentials(
    `${API_BASE}/api/timer/sessions/${state.sessionId}/save`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isbn,
        firstPage,
        lastPage,
        rating,
        laps: laps.map((l) => ({
          elapsedMs: l.elapsedMs,
          note: l.note,
          refPage: l.refPage,
        })),
      }),
    },
  );

  const result = await handleResponse<TimerSessionSaveResponse>(response);

  // Clear local state after successful save
  clearTimerState();
  stopTickLoop();

  if (_tickCallback) {
    _tickCallback({ elapsed: 0, h: 0, m: 0, s: 0, isRunning: false });
  }

  return result;
};

