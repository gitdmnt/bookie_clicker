/**
 * 統合API - 環境に応じてTauriまたはWebバックエンドを自動選択
 */
import { isTauri } from "./env-detect";
import * as TauriAPI from "./api-tauri";
import * as WebAPI from "./api-web";

// 環境に応じたAPI実装を選択
const api = isTauri() ? TauriAPI : WebAPI;

// ============================================================
// Book API
// ============================================================

export const searchBooksByISBN = api.searchBooksByISBN;
export const scanBarcodeISBN = api.scanBarcodeISBN;

// ============================================================
// Database Operations
// ============================================================

export const addBook = api.addBook;
export const addReadingLog = api.addReadingLog;
export const addLaps = api.addLaps;
export const selectBooks = api.selectBooks;
export const selectReadingLogs = api.selectReadingLogs;
export const selectLaps = api.selectLaps;
export const deleteBooks = api.deleteBooks;
export const deleteReadingLogs = api.deleteReadingLogs;
export const deleteLap = api.deleteLap;
export const exportDatabase = api.exportDatabase;

// ============================================================
// Timer Operations
// ============================================================

export const startTimer = api.startTimer;
export const stopTimer = api.stopTimer;
export const resetTimer = api.resetTimer;
export const getTimer = api.getTimer;
export const getTimerLaps = api.getTimerLaps;
export const timerLap = api.timerLap;
export const onTimerTick = api.onTimerTick;

// ============================================================
// Other External APIs (環境非依存)
// ============================================================

export const fetchWikipediaData = async (title: string) => {
  const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
    title,
  )}`;
  const response = await fetch(url);
  const data = await response.json();
  const pages = data.query.search;
  return pages;
};

