interface BookInfo {
  isbn: number;
  title: string;
  subtitle: string;
  authors: string[];
  image_url: string;
  total_page_count: number;
}

interface Activity {
  isbn: number;
  range: number[];
  date: string;
  memo: string;
  rating: number;
}
