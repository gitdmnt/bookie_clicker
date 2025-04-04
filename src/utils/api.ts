import { invoke } from "@tauri-apps/api/core";
import { Query, Book } from "@/types";
import { XMLParser } from "fast-xml-parser";

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

export const searchBooksByISBN = async (isbn: string) => {
  // Only use digits from input, then try to match ISBN-10/13 format.
  let i = isbn.replace(/\D/g, "").match(/^((97)(8|9))?(\d{10})$/)?.[0];
  if (!i) {
    return [];
  }
  isbn = i;

  const fetchNDL = async (isbn: string) => {
    const isbn_13 = isbn.length === 13 ? isbn : `978${isbn}`;
    const url_13 = `https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&recordSchema=dcndl&recordPacking=xml&query=isbn%3d${isbn_13}`;
    const parser = new XMLParser();

    console.log(`hitting NDL Search API: ${url_13}`);
    let data = await fetch(url_13);
    let json: any = parser.parse(await data.text());
    if (json.searchRetrieveResponse && json.searchRetrieveResponse.records) {
      console.log(`data fetched!`);
      return json.searchRetrieveResponse.records;
    }

    console.log(`data not found for ${isbn_13}, trying isbn-10`);
    const isbn_10 = isbn.length === 13 ? isbn.slice(3, -1) : isbn;
    const url_10 = `https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&recordSchema=dcndl&recordPacking=xml&query=isbn%3d${isbn_10}`;

    console.log(`hitting NDL Search API: ${url_10}`);
    data = await fetch(url_10);
    json = parser.parse(await data.text());
    if (json.searchRetrieveResponse && json.searchRetrieveResponse.records) {
      console.log(`data fetched!`);
      return json.searchRetrieveResponse.records;
    }

    console.log("data not found.");
    return {};
  };

  const records = await fetchNDL(isbn);
  const formatBookInfo = (data: any): Book[] => {
    console.log(data);
    // Handle cases where "data.record" might be an object or an array
    const recordsArray = Array.isArray(data.record)
      ? data.record
      : [data.record];
    const books = recordsArray.map((record: any) => {
      const resource = record.recordData["rdf:RDF"]["dcndl:BibResource"][0];
      const isbn_13 = isbn.length === 13 ? isbn : `978${isbn}`;
      const title = resource["dc:title"]["rdf:Description"]["rdf:value"];
      const seriesTitle = resource["dcndl:seriesTitle"]
        ? resource["dcndl:seriesTitle"]["rdf:Description"]["rdf:value"]
        : "";
      const authors = Array.isArray(resource["dcterms:creator"])
        ? resource["dcterms:creator"].map((a: any) =>
            a["foaf:Agent"]["foaf:name"]
              .split(/,\s?/)
              .filter((n: string) => !/^\d{4}/.test(n))
              .join(" ")
          )
        : [
            resource["dcterms:creator"]["foaf:Agent"]["foaf:name"]
              .split(/,\s?/)
              .filter((n: string) => !/^\d{4}/.test(n))
              .join(" "),
          ];
      const publisher =
        resource["dcterms:publisher"]["foaf:Agent"]["foaf:name"];

      const year = resource["dcterms:issued"]
        ? typeof resource["dcterms:issued"] === "number"
          ? resource["dcterms:issued"]
          : Number(resource["dcterms:issued"].match(/^\d+/)[0])
        : undefined;

      const book: Book = {
        isbn: Number(isbn_13),
        title: title,
        seriesTitle: seriesTitle,
        authors: authors,
        imageUrl: `https://ndlsearch.ndl.go.jp/thumbnail/${isbn_13}.jpg`,
        pageCount: Number(resource["dcterms:extent"].match(/^\d+/)[0]),
        publisher: publisher,
        year: year,
      };
      return book;
    });
    return books;
  };

  const books = formatBookInfo(records);
  return books;
};

import { fetch } from "@tauri-apps/plugin-http";

export const fetchWikipediaData = async (title: string) => {
  const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
    title
  )}`;
  const response = await fetch(url);
  const data = await response.json();
  const pages = data.query.search;
  return pages;
};
