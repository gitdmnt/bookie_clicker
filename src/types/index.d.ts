export interface Book {
  isbn: number;
    title: string;
    seriesTitle?: string;
  authors: string[];
  imageUrl: string;
  pageCount: number;
  publisher: string;
  year?: number;
}

export interface ReadingLog {
  id: string;
  isbn: number;
  time: [string, string]; // Start and end time as ISO formatted strings
  page: [number, number];
  note: string;
  rating: number;
}

export interface Query {
  elementType: string;
  isbn?: number;
  [key: string]: any;
}
