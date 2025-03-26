import React, { useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { Book } from "@/types";
import { addElement } from "@/utils/api";

interface AddBookModalProps {
  onClose: () => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose }) => {
  const [searchResults, setSearchResults] = useState<Book[]>([]);

  // Search NDL using ISBN
  const searchBooks = async (isbn: string) => {
    // Only use digits from input, then try to match ISBN-10/13 format.
    let i = isbn.replace(/\D/g, "").match(/^((97)(8|9))?(\d{10})$/)?.[0];
    if (!i) {
      setSearchResults([]);
      return;
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
    setSearchResults(books);
  };

  // Add book to backend DB
  const handleAddBook = async (book: Book) => {
    await addElement("book", book);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add New Book</h2>
        <input
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          placeholder="Search by ISBN"
          onChange={(e) => searchBooks(e.target.value)}
        />
        <ul>
          {searchResults.map((book) => (
            <li key={book.isbn}>
              <button
                onClick={() => handleAddBook(book)}
                className="w-full hover:bg-slate-300 p-2 text-left"
              >
                <h3>{book.title}</h3>
                <p>{(book.authors ?? []).join(", ")}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddBookModal;
