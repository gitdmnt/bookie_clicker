/**
 * Tauri バックエンドAPI実装
 */
import { invoke } from "@tauri-apps/api/core";
import { Temporal } from "temporal-polyfill";

// ============================================================
// Book API
// ============================================================

export const parseISBN = async (input: string): Promise<number | null> => {
  try {
    const isbn = await invoke<number>("parse_isbn", { input });
    return isbn;
  } catch (error) {
    return null;
  }
};

export const searchBooksByISBN = async (isbn: string): Promise<Book[]> => {
  const digits = isbn.replace(/\D/g, "");
  if (!digits) {
    return [];
  }

  try {
    const books = await invoke<Book[]>("search_book", { isbn: digits });
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
  try {
    // 1. バーコード認識でISBN文字列を取得
    const isbnString = await invoke<string>("scan_barcode", { imageData });

    // 2. ISBN文字列を検証
    const isbnNumber = await parseISBN(isbnString);
    if (!isbnNumber) {
      throw new Error(
        `認識されたコード「${isbnString}」は有効なISBNではありません。ISBN-10またはISBN-13のバーコードをスキャンしてください。`,
      );
    }

    // 3. NDL APIで書籍検索
    const books = await searchBooksByISBN(isbnString);
    if (books.length === 0) {
      throw new Error(
        `ISBN「${isbnString}」に該当する書籍が見つかりませんでした。別のバーコードをお試しください。`,
      );
    }

    return books;
  } catch (error) {
    // エラーメッセージをそのまま再スロー(文字列またはErrorオブジェクト)
    if (typeof error === "string") {
      throw error;
    } else if (error instanceof Error) {
      throw error.message;
    } else {
      throw "バーコードのスキャンに失敗しました。";
    }
  }
};

// ============================================================
// Database Operations
// ============================================================

export const addBook = async (book: Book): Promise<void> => {
  try {
    await invoke("add_book", { book });
  } catch (error) {
    console.error("Failed to add book", error);
    throw error;
  }
};

export const addReadingLog = async (readingLog: ReadingLog): Promise<void> => {
  try {
    await invoke("add_reading_log", { readingLog });
  } catch (error) {
    console.error("Failed to add reading log", error);
    throw error;
  }
};

export const addLaps = async (
  readingLog: ReadingLog,
  laps: Lap[],
): Promise<void> => {
  try {
    await invoke("add_laps", { readingLog, laps });
  } catch (error) {
    console.error("Failed to add laps", error);
    throw error;
  }
};

export const selectBooks = async (query: Query): Promise<Book[]> => {
  try {
    const books = await invoke<Book[]>("select_books", { query });
    return books;
  } catch (error) {
    console.error("Failed to select books", error);
    throw error;
  }
};

export const selectReadingLogs = async (
  query: Query,
): Promise<ReadingLog[]> => {
  try {
    const readingLogs = await invoke<ReadingLog[]>("select_reading_logs", {
      query,
    });
    readingLogs.map((log) => {
      log.createdAt = Temporal.PlainDateTime.from(log.createdAt);
      return log;
    });
    return readingLogs;
  } catch (error) {
    console.error("Failed to select reading logs", error);
    throw error;
  }
};

export const selectLaps = async (readingLog: ReadingLog): Promise<Lap[]> => {
  try {
    const laps = await invoke<Lap[]>("select_laps", { readingLog });
    laps.map((lap) => {
      lap.createdAt = lap.createdAt
        ? Temporal.PlainDateTime.from(lap.createdAt)
        : undefined;
      return lap;
    });
    return laps;
  } catch (error) {
    console.error("Failed to select laps", error);
    throw error;
  }
};

export const deleteBooks = async (query: Query): Promise<void> => {
  try {
    await invoke("delete_books", { query });
  } catch (error) {
    console.error("Failed to delete books", error);
    throw error;
  }
};

export const deleteReadingLogs = async (query: Query): Promise<void> => {
  try {
    await invoke("delete_reading_logs", { query });
  } catch (error) {
    console.error("Failed to delete reading logs", error);
    throw error;
  }
};

export const deleteLap = async (id: String): Promise<void> => {
  try {
    await invoke("delete_laps", { id });
  } catch (error) {
    console.error("Failed to delete lap", error);
    throw error;
  }
};

export const exportDatabase = async (): Promise<string> => {
  try {
    const result = await invoke<string>("export_db");
    return result;
  } catch (error) {
    console.error("Failed to export database", error);
    throw error;
  }
};

// ============================================================
// Timer Operations
// ============================================================

export const startTimer = async (): Promise<void> => {
  await invoke<TimerTick>("timer_start");
};
export const stopTimer = async (): Promise<void> => {
  await invoke<TimerTick>("timer_stop");
};
export const resetTimer = async (): Promise<void> => {
  await invoke("timer_reset");
};

export const getTimer = async (): Promise<TimerTick> => {
  return await invoke<TimerTick>("timer_get");
};

export const getTimerLaps = async (): Promise<Lap[]> => {
  return await invoke<Lap[]>("timer_get_laps");
};

export const timerLap = async (note: string, refPage: number): Promise<Lap> => {
  return await invoke<Lap>("timer_lap", { note, refPage });
};

