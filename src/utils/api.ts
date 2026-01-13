import { invoke } from "@tauri-apps/api/core";

/**
 * Select elements from the backend that match the given query.
 * @param query - The query object to select elements (e.g., books or reading logs).
 * @returns A promise resolving to the fetched data.
 */
export async function selectElements(query: Query): Promise<any> {
  try {
    const result = await invoke("select", { query });
    return result;
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
    // Build the payload according to the element type.
    const payload =
      elementType === "book"
        ? { elementType, book: data }
        : { elementType, readingLog: data };
    const result = await invoke("add", { e: payload });
    return result;
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
    const result = await invoke("delete", { query });
    return result;
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

export const exportDatabase = async (): Promise<string> => {
  try {
    const result = await invoke<string>("export_db");
    return result;
  } catch (error) {
    console.error("Failed to export database", error);
    throw error;
  }
};
