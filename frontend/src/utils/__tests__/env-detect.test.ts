/**
 * env-detect.ts のユニットテスト
 */
import { describe, it, expect, afterEach } from "vitest";
import { isTauri } from "@/utils/env-detect";

describe("isTauri", () => {
  afterEach(() => {
    // __TAURI__ プロパティをクリーンアップ
    if ("__TAURI__" in window) {
      delete (window as any).__TAURI__;
    }
  });

  it("__TAURI__ がない場合は false を返す", () => {
    expect(isTauri()).toBe(false);
  });

  it("__TAURI__ がある場合は true を返す", () => {
    (window as any).__TAURI__ = {};
    expect(isTauri()).toBe(true);
  });
});

