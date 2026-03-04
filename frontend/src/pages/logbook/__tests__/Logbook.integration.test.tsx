/**
 * Logbook ページの結合テスト
 *
 * API モックを使い、読書記録の表示フローをテストする。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createBook, createReadingLog } from "@/__tests__/helpers";
import { Temporal } from "temporal-polyfill";

const { mockSelectReadingLogs, mockSelectLaps } = vi.hoisted(() => ({
  mockSelectReadingLogs: vi.fn().mockResolvedValue([]),
  mockSelectLaps: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/utils/api", () => ({
  selectReadingLogs: mockSelectReadingLogs,
  selectLaps: mockSelectLaps,
  selectBooks: vi.fn().mockResolvedValue([]),
}));

import { Logbook } from "@/pages/logbook";

describe("Logbook 結合テスト", () => {
  const book = createBook(9784001234567, {
    title: "テスト本",
    pageCount: 300,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("本が選択されていない場合、選択を促すメッセージを表示する", () => {
    render(<Logbook book={null} />);
    expect(screen.getByText("本を選択してください")).toBeTruthy();
  });

  it("本が選択されている場合、読書ログを取得する", async () => {
    const readingLog = createReadingLog(book.isbn, {
      page: [1, 50],
      sessionDurationSec: 1800,
      createdAt: Temporal.PlainDateTime.from("2025-06-01T10:00"),
    });
    mockSelectReadingLogs.mockResolvedValue([readingLog]);
    mockSelectLaps.mockResolvedValue([]);

    render(<Logbook book={book} />);

    await waitFor(() => {
      expect(mockSelectReadingLogs).toHaveBeenCalledWith({
        elementType: "readingLog",
        isbn: book.isbn,
      });
    });
  });

  it("APIエラー時にクラッシュしない", async () => {
    mockSelectReadingLogs.mockRejectedValue(new Error("Network error"));

    render(<Logbook book={book} />);

    await waitFor(() => {
      expect(mockSelectReadingLogs).toHaveBeenCalled();
    });
  });
});

