/**
 * 環境検出ユーティリティ
 */

/**
 * Tauri環境で実行中かどうかを判定
 */
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};
