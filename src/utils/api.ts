import { invoke } from "@tauri-apps/api/core";
import { Query } from "../types";

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
export async function addElement(
  elementType: string,
  data: any
): Promise<any> {
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
