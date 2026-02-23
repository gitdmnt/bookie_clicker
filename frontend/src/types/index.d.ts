import { Temporal } from "temporal-polyfill";

declare global {
  export interface Book {
    isbn: number;
    title: string;
    seriesTitle?: string;
    authors: string[];
    imageUrl: string;
    pageCount: number;
    publisher: string;
    year?: number;
    createdAt: Temporal.PlainDateTime;
  }

  export interface ReadingLog {
    id?: string;
    isbn: number;
    createdAt: Temporal.PlainDateTime;
    sessionDurationSec: number;
    page: [number, number];
    rating: number;
  }

  export interface Lap {
    id?: string;
    createdAt?: Temporal.PlainDateTime;
    elapsedMs: number;
    note: string;
    refPage: number;
  }

  export interface Query {
    elementType: string;
    isbn?: number;
    [key: string]: any;
  }

  export interface StopwatchTime {
    h: number;
    m: number;
    s: number;
  }

  export interface LapNoteLog {
    startDateTime: Temporal.PlainDateTime;
    endDateTime: Temporal.PlainDateTime | null;
    lapNotes: LapNote[];
  }

  export interface TimerTick {
    elapsed: number;
    h: number;
    m: number;
    s: number;
    isRunning: boolean;
  }

  /** Web版タイマーセッション（バックエンド応答） */
  export interface TimerSessionResponse {
    id: string;
    startTime: string; // ISO 8601
    stopTime?: string | null;
    durationSec?: number;
    isRunning: boolean;
  }

  /** Web版タイマーセッション保存応答 */
  export interface TimerSessionSaveResponse {
    readingLogId: string;
    sessionDurationSec: number;
  }
}

