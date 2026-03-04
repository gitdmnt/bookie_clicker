/**
 * isbn.ts のユニットテスト
 */
import { describe, it, expect } from "vitest";
import { parseIsbn } from "@/utils/isbn";

describe("parseIsbn", () => {
  // ============================================================
  // ISBN-13
  // ============================================================

  describe("ISBN-13", () => {
    it("有効なISBN-13を数値で返す", () => {
      expect(parseIsbn("9784001234565")).toBe(9784001234565);
    });

    it("ハイフン付きISBN-13を正しく処理する", () => {
      expect(parseIsbn("978-4-001-23456-5")).toBe(9784001234565);
    });

    it("スペース付きISBN-13を正しく処理する", () => {
      expect(parseIsbn("978 4 001 23456 5")).toBe(9784001234565);
    });

    it("チェックディジットが不正なISBN-13はエラーを投げる", () => {
      expect(() => parseIsbn("9784001234568")).toThrow();
    });

    it("数字以外が含まれるISBN-13はエラーを投げる", () => {
      expect(() => parseIsbn("978400123456A")).toThrow();
    });
  });

  // ============================================================
  // ISBN-10
  // ============================================================

  describe("ISBN-10", () => {
    it("有効なISBN-10をISBN-13に変換して返す", () => {
      // ISBN-10: 4001234564 → ISBN-13: 9784001234565
      const result = parseIsbn("4001234564");
      expect(result).toBe(9784001234565);
    });

    it("ハイフン付きISBN-10を正しく処理する", () => {
      const result = parseIsbn("4-001-23456-4");
      expect(result).toBe(9784001234565);
    });

    it("Xで終わるISBN-10を正しく処理する", () => {
      // ISBN-10のチェックディジットにXが使われるケース
      const result = parseIsbn("155404295X");
      expect(typeof result).toBe("number");
    });

    it("チェックディジットが不正なISBN-10はエラーを投げる", () => {
      expect(() => parseIsbn("4001234561")).toThrow();
    });
  });

  // ============================================================
  // 不正な入力
  // ============================================================

  describe("不正な入力", () => {
    it("短すぎる文字列はnullを返す", () => {
      expect(parseIsbn("12345")).toBeNull();
    });

    it("長すぎる文字列はnullを返す", () => {
      expect(parseIsbn("12345678901234")).toBeNull();
    });

    it("空文字はnullを返す", () => {
      expect(parseIsbn("")).toBeNull();
    });

    it("ハイフンのみはnullを返す", () => {
      expect(parseIsbn("---")).toBeNull();
    });
  });
});

