type BookAttr = {
  isbn: string;
    title: string;
    subtitle: string;
    authors: string[];
    imageUrl: string;
    totalPageCount: number;
}

type BookStatus = {
  readStatus: string;
  combinedFlag: {
    b64: string;
  };
  progresses: Progress[];
  lastRead: string;
  star: number;
};

type Progress = {
  termStart: string;
    termEnd: string;
    flag: {
      b64: string;
    };
    memo: string;
    star: number;
}

type Book = {
  attr: BookAttr;
  status: BookStatus;
};

type Books = {
  items: Book[];
}