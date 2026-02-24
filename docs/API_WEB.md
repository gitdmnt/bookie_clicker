# api-web.ts — バックエンド API ラッパー仕様

`frontend/src/utils/api-web.ts` は Cloudflare Workers 上で動作する Web バックエンド（`apps/backend-web`）に対して HTTP リクエストを発行し、フロントエンドに統一されたインターフェースを提供するユーティリティモジュールです。

---

## ベース URL

```
VITE_API_BASE_URL（未設定の場合: http://localhost:8787）
```

---

## 内部ヘルパー

| 関数                                | 説明                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `fetchWithCredentials(input, init)` | `credentials: "include"` を付与して `fetch` を呼び出す。Cookie ベースのセッション認証に対応する。                   |
| `handleResponse<T>(response)`       | レスポンスを検査し、エラー時は例外をスロー。204 / 空ボディは `undefined` を返す。それ以外は JSON をパースして返す。 |

---

## Book API

### `searchBooksByISBN(isbn: string): Promise<Book[]>`

- **エンドポイント**: `POST /api/books/search`
- **概要**: ISBN（数字以外を除去）でバックエンド経由の書籍検索を行う。  
  `createdAt` を `Temporal.PlainDateTime` に変換して返す。
- **エラー時**: 空配列を返す（例外はコンソールに出力）。

### `scanBarcodeISBN(_imageData: string): Promise<Book[]>`

- **概要**: Web 版では**未実装**。呼び出すと常に例外をスローする。

### `addBook(book: Book): Promise<void>`

- **エンドポイント**: `POST /api/books`
- **概要**: 書籍をユーザーの本棚に追加する。

### `selectBooks(query: Query): Promise<Book[]>`

- **エンドポイント**: `GET /api/books?isbn=<isbn>`
- **概要**: クエリ条件（ISBN）に合致する書籍一覧を取得する。

### `deleteBooks(query: Query): Promise<void>`

- **エンドポイント**: `DELETE /api/books?isbn=<isbn>`
- **概要**: クエリ条件（ISBN）に合致する書籍を削除する。

---

## Reading Log API

### `addReadingLog(readingLog: ReadingLog): Promise<void>`

- **エンドポイント**: `POST /api/reading-logs`
- **概要**: 読書ログを追加する。

### `selectReadingLogs(query: Query): Promise<ReadingLog[]>`

- **エンドポイント**: `GET /api/reading-logs?isbn=<isbn>&id=<id>`
- **概要**: クエリ条件（ISBN / ID）に合致する読書ログ一覧を取得する。  
  `createdAt` を `Temporal.PlainDateTime` に変換して返す。

### `deleteReadingLogs(query: Query): Promise<void>`

- **エンドポイント**: `DELETE /api/reading-logs?id=<id>`
- **概要**: クエリ条件（ID）に合致する読書ログを削除する。

---

## Lap API

### `addLaps(readingLog: ReadingLog, laps: Lap[]): Promise<void>`

- **エンドポイント**: `POST /api/laps`
- **ボディ**: `{ readingLog, laps }`
- **概要**: 読書ログと紐づくラップ一覧を一括追加する。

### `selectLaps(readingLog: ReadingLog): Promise<Lap[]>`

- **エンドポイント**: `GET /api/laps?reading_log_id=<id>`
- **概要**: 指定した読書ログに紐づくラップ一覧を取得する。  
  `createdAt` が存在する場合は `Temporal.PlainDateTime` に変換して返す。

### `deleteLap(id: string): Promise<void>`

- **エンドポイント**: `DELETE /api/laps/:id`
- **概要**: 指定した ID のラップを削除する。

---

## Export API

### `exportDatabase(): Promise<string>`

- **エンドポイント**: `GET /api/export`
- **概要**: データベース全体をエクスポートし、Base64 等のデータ文字列として返す。

---

## Timer API

タイマー機能はバックエンドとローカル（`localStorage`）の**ハイブリッド状態管理**を採用しています。

### ローカル状態（`TimerLocalState`）

`localStorage` に `lapnote-timer-state` キーで保存され、以下のフィールドを持ちます。

| フィールド            | 型               | 説明                                             |
| --------------------- | ---------------- | ------------------------------------------------ |
| `sessionId`           | `string \| null` | バックエンドが発行するセッション ID              |
| `serverStartTime`     | `string \| null` | バックエンドが返す開始時刻（ISO 8601）           |
| `localStartTimestamp` | `number \| null` | 直近のスタート時点の `Date.now()`                |
| `accumulatedMs`       | `number`         | 過去の start/stop サイクルで蓄積された経過ミリ秒 |
| `isRunning`           | `boolean`        | 現在タイマーが動作中かどうか                     |
| `laps`                | `Lap[]`          | 未保存のラップ一覧                               |

### `startTimer(): Promise<void>`

- **概要**: タイマーを開始・再開する。
  - 実行中かつセッション有 → 何もしない
  - 停止中かつセッション有 → `PATCH /api/timer/sessions/:id/resume` を呼び出して再開
  - セッション無 → `POST /api/timer/sessions` で新規セッション作成後にティックループ開始

### `stopTimer(): Promise<void>`

- **エンドポイント**: `PATCH /api/timer/sessions/:id/stop`
- **概要**: タイマーを停止する。経過時間を `accumulatedMs` に蓄積し、ローカル状態を更新してからバックエンドに通知する。

### `resetTimer(): Promise<void>`

- **エンドポイント**: `DELETE /api/timer/sessions`
- **概要**: タイマーをリセットする。バックエンドの未保存セッションを削除し、ローカル状態と表示をクリアする。

### `getTimer(): Promise<TimerTick>`

- **概要**: 現在の経過時間をローカル状態から計算して返す（API 呼び出しなし）。

### `getTimerLaps(): Promise<Lap[]>`

- **概要**: ローカル状態から未保存のラップ一覧を返す（API 呼び出しなし）。

### `timerLap(note: string, refPage: number): Promise<Lap>`

- **概要**: 現在の経過時間でラップを記録し、ローカル状態に追加して返す（API 呼び出しなし）。

### `onTimerTick(cb: (tick: TimerTick) => void): Promise<() => Promise<void>>`

- **エンドポイント（初期化時）**: `GET /api/timer/sessions/current`
- **概要**: タイマーのティック（200ms 間隔）コールバックを登録する。  
  初回呼び出し時にバックエンドから現在セッションを取得し、ローカル状態と同期する。  
  タイマーが動作中であればティックループを起動し、即座に初回ティックを発火する。  
  返り値は登録解除関数（呼び出すとコールバックとループを停止）。

### `saveTimerSession(isbn, firstPage, lastPage, rating, laps): Promise<TimerSessionSaveResponse>`

- **エンドポイント**: `POST /api/timer/sessions/:id/save`
- **ボディ**:
  ```json
  {
    "isbn": 1234567890123,
    "firstPage": 1,
    "lastPage": 50,
    "rating": 4,
    "laps": [{ "elapsedMs": 300000, "note": "メモ", "refPage": 25 }]
  }
  ```
- **概要**: 現在のタイマーセッションに読書情報とラップを紐づけて保存する。  
  保存成功後、ローカル状態をクリアしてタイマー表示をリセットする。
- **戻り値**: `{ readingLogId: string, sessionDurationSec: number }`

---

## 型一覧

| 型名                       | 説明                                                           |
| -------------------------- | -------------------------------------------------------------- |
| `Book`                     | 書籍情報（ISBN、タイトル、著者、ページ数など）                 |
| `ReadingLog`               | 読書ログ（ISBN、セッション時間、ページ範囲、評価など）         |
| `Lap`                      | ラップ（経過ミリ秒、メモ、参照ページ）                         |
| `Query`                    | 検索クエリ（ISBN / ID）                                        |
| `TimerTick`                | タイマー表示用データ（経過時間、時/分/秒、動作状態）           |
| `TimerSessionResponse`     | バックエンドが返すセッション情報（ID、開始時刻、動作状態など） |
| `TimerSessionSaveResponse` | セッション保存後のレスポンス（読書ログ ID、セッション時間）    |

