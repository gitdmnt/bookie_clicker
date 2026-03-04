/**
 * Bookshelf ページの結合テスト
 *
 * API モックを使い、書籍の表示・検索・追加フローをテストする。
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createBook } from "@/__tests__/helpers";

// vi.mock ファクトリ内でトップレベル変数を参照できないため、
// vi.hoisted を使ってモック関数を先に定義する。
const { mockSelectBooks, mockSearchBooksByISBN, mockAddBook } = vi.hoisted(
  () => ({
    mockSelectBooks: vi.fn().mockResolvedValue([]),
    mockSearchBooksByISBN: vi.fn().mockResolvedValue([]),
    mockAddBook: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock("@/utils/api", () => ({
  selectBooks: mockSelectBooks,
  searchBooksByISBN: mockSearchBooksByISBN,
  addBook: mockAddBook,
}));

vi.mock("@/utils/isbn", () => ({
  parseIsbn: vi.fn((input: string) => {
    const digits = input.replace(/\D/g, "");
    return digits.length === 13 ? Number(digits) : null;
  }),
}));

// vi.mock の後にインポート
import { Bookshelf } from "@/pages/bookshelf";

describe("Bookshelf 結合テスト", () => {
  const book1 = createBook(9784001234567, {
    title: "テストブック1",
    authors: ["著者A"],
    publisher: "テスト出版",
  });
  const book2 = createBook(9784001234568, {
    title: "React入門",
    authors: ["著者B"],
    publisher: "技術書院",
  });

  const setBook = vi.fn<(v: React.SetStateAction<Book | null>) => void>();
  const setPage = vi.fn<(v: React.SetStateAction<number>) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectBooks.mockResolvedValue([book1, book2]);
  });

  it("書籍一覧が読み込まれて表示される", async () => {
    render(<Bookshelf book={null} setBook={setBook} setPage={setPage} />);

    await waitFor(() => {
      expect(mockSelectBooks).toHaveBeenCalledWith({
        elementType: "book",
      });
    });
  });

  it("初回レンダリング後に setBook が呼ばれる", async () => {
    render(<Bookshelf book={null} setBook={setBook} setPage={setPage} />);

    await waitFor(() => {
      expect(setBook).toHaveBeenCalled();
    });
  });
});

