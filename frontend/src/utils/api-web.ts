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

export const scanBarcodeISBN = async (imageData: string): Promise<Book[]> => {
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

export const startTimer = async (): Promise<void> => {
  console.error("startTimer is called, but unimplemented yet.");
};
export const stopTimer = async (): Promise<void> => {
  console.error("stopTimer is called, but unimplemented yet.");
};
export const resetTimer = async (): Promise<void> => {
  console.error("resetTimer is called, but unimplemented yet.");
};

export const getTimer = async (): Promise<TimerTick> => {
  console.error("getTimer is called, but unimplemented yet.");
  throw new Error("タイマー機能はWeb版では未実装です");
};

export const getTimerLaps = async (): Promise<Lap[]> => {
  console.error("getTimerLaps is called, but unimplemented yet.");
  throw new Error("タイマー機能はWeb版では未実装です");
};

export const timerLap = async (
  _note: string,
  _refPage: number,
): Promise<Lap> => {
  console.error("timerLap is called, but unimplemented yet.");
  throw new Error("タイマー機能はWeb版では未実装です");
};

export const onTimerTick = async (
  _cb: (tick: TimerTick) => void,
): Promise<() => Promise<void>> => {
  // Web 環境ではタイマーのイベントは存在しないため noop の解除関数を返す
  return async () => {
    /* noop */
  };
};

