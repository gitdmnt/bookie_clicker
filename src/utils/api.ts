import { invoke } from "@tauri-apps/api/core";

/**
 * Select elements from the backend that match the given query.
 * @param query - The query object to select elements (e.g., books or reading logs).
 * @returns A promise resolving to the fetched data.
 */
export async function selectElements(query: Query): Promise<any> {
  try {
    if (query.elementType === "book") {
      return await invoke("select_books", { query });
    }
    return await invoke("select_reading_logs", { query });
  } catch (error) {
    console.error("Error in selectElements:", error);
    throw error;
  }
}

/**
 * Adds an element (book or reading log) to the backend.
 * @param elementType - The type of element to add ("book" or "readingLog").
 * @param data - The data object for the element.
 * @returns A promise resolving to the result of the add operation.
 */
export async function addElement(elementType: string, data: any): Promise<any> {
  try {
    if (elementType === "book") {
      return await invoke("add_book", { book: data });
    }
    return await invoke("add_reading_log", { readingLog: data });
  } catch (error) {
    console.error("Error in addElement:", error);
    throw error;
  }
}

/**
 * Deletes elements from the backend based on the provided query.
 * @param query - The query object specifying which elements to delete.
 * @returns A promise resolving to the result of the delete operation.
 */
export async function deleteElements(query: Query): Promise<any> {
  try {
    if (query.elementType === "book") {
      return await invoke("delete_books", { query });
    }
    return await invoke("delete_reading_logs", { query });
  } catch (error) {
    console.error("Error in deleteElements:", error);
    throw error;
  }
}

/**
 *
 * @param isbn
 * @returns
 */

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
    }));
  } catch (error) {
    console.error("Error searching books via backend", error);
    return [];
  }
};

export const fetchWikipediaData = async (title: string) => {
  const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
    title
  )}`;
  const response = await fetch(url);
  const data = await response.json();
  const pages = data.query.search;
  return pages;
};

// commands/db.rs

// add

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
  laps: Lap[]
): Promise<void> => {
  try {
    await invoke("add_laps", { readingLog, laps });
  } catch (error) {
    console.error("Failed to add laps", error);
    throw error;
  }
};

// select

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
  query: Query
): Promise<ReadingLog[]> => {
  try {
    const readingLogs = await invoke<ReadingLog[]>("select_reading_logs", {
      query,
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
    return laps;
  } catch (error) {
    console.error("Failed to select laps", error);
    throw error;
  }
};

// delete
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

//

export const exportDatabase = async (): Promise<string> => {
  try {
    const result = await invoke<string>("export_db");
    return result;
  } catch (error) {
    console.error("Failed to export database", error);
    throw error;
  }
};
