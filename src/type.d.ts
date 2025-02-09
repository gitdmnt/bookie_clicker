// 登録される書籍情報の型定義
/*
type AbstractBook = Book | Article | Wikipedia | WebNovel;

type Book = {
  isbn: number;
  title: string;
  authors: string[];
  publisher: string;
  year: number | null; // publication year
  pageCount: number;
  imageUrl: string | null;
};

type Article = {
  doi: string;
  title: string;
  authors: string[];
  journal: string;
  volume: number | null;
  issue: number | null;
  page: string | null;
  year: number;
};

type Wikipedia = {
  title: string;
  url: string;
  language: string;
  website: "wikipedia";
};

type WebNovel = {
  title: string;
  authors: string[];
  website: "pixiv" | "narou" | "hameln";
  imageUrl: string | null;
};
*/
type TableElement = Book | Record;

interface Book {
  isbn: number;
  title: string;
  authors: string[];
  publisher: string;
  year?: number;
  pageCount: number;
  imageUrl?: string;
}

interface Record {
  id: number;
  user: number;
  isbn: number;
}

interface Query {
  // Metadata
  elementType: Element;
  user?: number;

  // Book fields
  isbn?: number;
  title?: string;
  author?: string;
  publisher?: string;

  // Record fields
  id?: number;
  term?: number;
}

