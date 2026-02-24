# Bookie API 仕様書

バックエンドは Cloudflare Workers (Rust) 上で動作します。

---

## 認証方式

Cookie ベースのセッション認証を使用します。  
ログイン後、サーバーが `HttpOnly; Secure; SameSite=Lax` な `session` Cookie を発行します。  
**認証が必要なエンドポイント**（🔒 マーク）はすべてこの Cookie を送信する必要があります。Cookie が存在しない・無効・期限切れの場合は **500** が返ります。

---

## ベース URL

```
https://<worker-domain>
```

---

## エンドポイント一覧

| メソッド | パス                             | 認証 | 概要                           |
| -------- | -------------------------------- | :--: | ------------------------------ |
| GET      | `/`                              |  -   | ヘルスチェック                 |
| GET      | `/health`                        |  -   | ヘルスチェック                 |
| POST     | `/api/auth/google/callback`      |  -   | Google OAuth コールバック      |
| GET      | `/api/auth/me`                   |  🔒  | 現在のユーザー情報を取得       |
| POST     | `/api/auth/logout`               |  🔒  | ログアウト                     |
| POST     | `/api/books`                     |  🔒  | 書籍を追加                     |
| GET      | `/api/books`                     |  🔒  | 書籍一覧を取得                 |
| DELETE   | `/api/books`                     |  🔒  | 書籍を削除                     |
| POST     | `/api/books/search`              |  -   | ISBNで書籍を検索（NDL API）    |
| POST     | `/api/reading-logs`              |  🔒  | 読書ログを追加                 |
| GET      | `/api/reading-logs`              |  🔒  | 読書ログ一覧を取得             |
| DELETE   | `/api/reading-logs`              |  🔒  | 読書ログを削除                 |
| POST     | `/api/laps`                      |  🔒  | ラップを追加（バッチ）         |
| GET      | `/api/laps`                      |  🔒  | ラップ一覧を取得               |
| DELETE   | `/api/laps/:id`                  |  🔒  | ラップを削除                   |
| POST     | `/api/timer/sessions`            |  🔒  | タイマーセッションを開始       |
| GET      | `/api/timer/sessions/current`    |  🔒  | 現在のタイマーセッションを取得 |
| PATCH    | `/api/timer/sessions/:id/stop`   |  🔒  | タイマーセッションを停止       |
| PATCH    | `/api/timer/sessions/:id/resume` |  🔒  | タイマーセッションを再開       |
| POST     | `/api/timer/sessions/:id/save`   |  🔒  | タイマーセッションを保存       |
| DELETE   | `/api/timer/sessions`            |  🔒  | 未保存セッションをリセット     |
| GET      | `/api/export`                    |  🔒  | データをエクスポート           |

---

## データモデル

### Book

```json
{
  "isbn": 9784873119038,
  "title": "プログラミングRust",
  "seriesTitle": null,
  "authors": ["Jim Blandy"],
  "publisher": "オライリー・ジャパン",
  "year": 2018,
  "pageCount": 600,
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

| フィールド    | 型               | 必須 | 説明                 |
| ------------- | ---------------- | :--: | -------------------- |
| `isbn`        | `u64`            |  ✅  | ISBN（主キー）       |
| `title`       | `string`         |  ✅  | タイトル             |
| `seriesTitle` | `string \| null` |  -   | シリーズタイトル     |
| `authors`     | `string[]`       |  ✅  | 著者リスト           |
| `publisher`   | `string`         |  ✅  | 出版社               |
| `year`        | `u32`            |  ✅  | 出版年               |
| `pageCount`   | `u32`            |  ✅  | ページ数             |
| `imageUrl`    | `string`         |  ✅  | 表紙画像 URL         |
| `createdAt`   | `string \| null` |  -   | 登録日時（RFC 3339） |

---

### ReadingLog

```json
{
  "id": "uuid-...",
  "isbn": 9784873119038,
  "createdAt": "2024-01-01T10:00:00Z",
  "sessionDurationSec": 3600,
  "page": [1, 50],
  "rating": 4
}
```

| フィールド           | 型               | 必須 | 説明                       |
| -------------------- | ---------------- | :--: | -------------------------- |
| `id`                 | `string \| null` |  -   | ID（サーバーが採番）       |
| `isbn`               | `u64`            |  ✅  | 対応する書籍の ISBN        |
| `createdAt`          | `string`         |  ✅  | 記録日時（RFC 3339）       |
| `sessionDurationSec` | `u64`            |  ✅  | 読書時間（秒）             |
| `page`               | `[u16, u16]`     |  ✅  | `[開始ページ, 終了ページ]` |
| `rating`             | `u8 \| null`     |  -   | 評価（0〜5）               |

---

### Lap

```json
{
  "id": "uuid-...",
  "elapsedMs": 120000,
  "note": "ここが重要",
  "refPage": 42,
  "createdAt": "2024-01-01T10:02:00Z"
}
```

| フィールド  | 型               | 必須 | 説明                               |
| ----------- | ---------------- | :--: | ---------------------------------- |
| `id`        | `string \| null` |  -   | ID（サーバーが採番）               |
| `elapsedMs` | `u64`            |  ✅  | セッション開始からの経過時間（ms） |
| `note`      | `string \| null` |  -   | メモ                               |
| `refPage`   | `u32 \| null`    |  -   | 参照ページ                         |
| `createdAt` | `string`         |  ✅  | 作成日時（RFC 3339）               |

---

### User

```json
{
  "id": "uuid-...",
  "googleId": "117...",
  "email": "user@example.com",
  "name": "ユーザー名",
  "pictureUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-06-01T00:00:00Z"
}
```

---

## エンドポイント詳細

---

### ヘルスチェック

#### `GET /`

```
200 OK
Bookie API Server
```

#### `GET /health`

```
200 OK
OK
```

---

### 認証

#### `POST /api/auth/google/callback`

Google の認可コードをトークンに交換し、ユーザーを作成/更新してセッションを発行します。

**リクエストボディ**

```json
{
  "code": "4/0AX4...",
  "code_verifier": "PKCE コードベリファイア文字列"
}
```

**レスポンス** `200 OK`

```json
{
  "user": {
    "id": "uuid-...",
    "googleId": "117...",
    "email": "user@example.com",
    "name": "ユーザー名",
    "pictureUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-06-01T00:00:00Z"
  }
}
```

Set-Cookie ヘッダーで `session` Cookie が発行されます（有効期間 7 日間）。

```
Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

---

#### `GET /api/auth/me` 🔒

現在ログイン中のユーザー情報を返します。

**レスポンス** `200 OK`

```json
{
  "id": "uuid-...",
  "googleId": "117...",
  "email": "user@example.com",
  "name": "ユーザー名",
  "pictureUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-06-01T00:00:00Z"
}
```

---

#### `POST /api/auth/logout` 🔒

セッションを無効化し、Cookie を削除します。

**レスポンス** `200 OK`（ボディなし）

Set-Cookie で `session` Cookie が削除されます。

---

### 書籍

#### `POST /api/books` 🔒

書籍をユーザーのシェルフに追加します。

**リクエストボディ** — [Book](#book) オブジェクト

**レスポンス** `200 OK`（ボディなし）

---

#### `GET /api/books` 🔒

ユーザーの書籍一覧を返します。

**クエリパラメータ**

| パラメータ | 型       | 必須 | 説明           |
| ---------- | -------- | :--: | -------------- |
| `isbn`     | `string` |  -   | ISBNで絞り込み |

**レスポンス** `200 OK`

```json
[
  { ...Book },
  ...
]
```

---

#### `DELETE /api/books` 🔒

書籍をユーザーのシェルフから削除します。

**クエリパラメータ**

| パラメータ | 型       | 必須 | 説明                               |
| ---------- | -------- | :--: | ---------------------------------- |
| `isbn`     | `string` |  -   | ISBNで絞り込み（省略時は全件対象） |

**レスポンス** `200 OK`（ボディなし）

---

#### `POST /api/books/search`

NDL（国立国会図書館）API を使って ISBN で書籍情報を検索します。  
ヒットした書籍はマスターテーブルに自動的に upsert されます。認証不要。

**リクエストボディ**

```json
{
  "isbn": "9784873119038"
}
```

**レスポンス** `200 OK`

```json
[
  { ...Book },
  ...
]
```

---

### 読書ログ

#### `POST /api/reading-logs` 🔒

読書ログを追加します。

**リクエストボディ** — [ReadingLog](#readinglog) オブジェクト（`id` は省略可）

**レスポンス** `200 OK`

```json
{
  "id": "uuid-..."
}
```

---

#### `GET /api/reading-logs` 🔒

読書ログを取得します。

**クエリパラメータ**

| パラメータ | 型       | 必須 | 説明             |
| ---------- | -------- | :--: | ---------------- |
| `isbn`     | `u64`    |  -   | ISBNで絞り込み   |
| `id`       | `string` |  -   | ログIDで絞り込み |

**レスポンス** `200 OK`

```json
[
  { ...ReadingLog },
  ...
]
```

---

#### `DELETE /api/reading-logs` 🔒

読書ログを削除します。

**クエリパラメータ**

| パラメータ | 型       | 必須 | 説明                                               |
| ---------- | -------- | :--: | -------------------------------------------------- |
| `id`       | `string` |  -   | ログIDで絞り込み（省略時はユーザーの全ログが対象） |

**レスポンス** `200 OK`（ボディなし）

---

### ラップ

#### `POST /api/laps` 🔒

読書ログと複数のラップをまとめて追加します（バッチ操作）。

**リクエストボディ**

```json
{
  "readingLog": { ...ReadingLog },
  "laps": [
    { ...Lap },
    ...
  ]
}
```

**レスポンス** `200 OK`（ボディなし）

---

#### `GET /api/laps` 🔒

指定した読書ログに紐づくラップ一覧を取得します。

**クエリパラメータ**

| パラメータ       | 型       | 必須 | 説明          |
| ---------------- | -------- | :--: | ------------- |
| `reading_log_id` | `string` |  ✅  | 読書ログの ID |

**レスポンス** `200 OK`

```json
[
  { ...Lap },
  ...
]
```

---

#### `DELETE /api/laps/:id` 🔒

指定した ID のラップを削除します。

**パスパラメータ**

| パラメータ | 型       | 説明                |
| ---------- | -------- | ------------------- |
| `id`       | `string` | 削除するラップの ID |

**レスポンス** `200 OK`（ボディなし）

---

### タイマーセッション

タイマーセッションはユーザーの読書タイマーの状態を管理します。  
1 ユーザーにつき未保存セッションは 1 つのみ存在できます。

#### `POST /api/timer/sessions` 🔒

タイマーセッションを開始します。  
既に進行中・停止中の未保存セッションが存在する場合はそれを返します。

**リクエストボディ** なし

**レスポンス** `200 OK`

```json
{
  "id": "uuid-...",
  "startTime": "2026-02-24T10:00:00Z",
  "isRunning": true
}
```

---

#### `GET /api/timer/sessions/current` 🔒

現在の未保存セッションを取得します。セッションが存在しない場合は `null` を返します。

**レスポンス** `200 OK`

```json
{
  "id": "uuid-...",
  "startTime": "2026-02-24T10:00:00Z",
  "stopTime": null,
  "durationSec": 300,
  "isRunning": true
}
```

または

```json
null
```

| フィールド    | 型               | 説明                                             |
| ------------- | ---------------- | ------------------------------------------------ |
| `id`          | `string`         | セッション ID                                    |
| `startTime`   | `string`         | 開始日時（RFC 3339）                             |
| `stopTime`    | `string \| null` | 停止日時（実行中は `null`）（RFC 3339）          |
| `durationSec` | `i64`            | 経過秒数（停止中は停止時点、実行中は現時刻基準） |
| `isRunning`   | `bool`           | 実行中かどうか                                   |

---

#### `PATCH /api/timer/sessions/:id/stop` 🔒

タイマーセッションを停止します。

**パスパラメータ**

| パラメータ | 型       | 説明          |
| ---------- | -------- | ------------- |
| `id`       | `string` | セッション ID |

**レスポンス** `200 OK`

```json
{
  "id": "uuid-...",
  "startTime": "2026-02-24T10:00:00Z",
  "stopTime": "2026-02-24T10:05:00Z",
  "durationSec": 300,
  "isRunning": false
}
```

---

#### `PATCH /api/timer/sessions/:id/resume` 🔒

停止中のタイマーセッションを再開します。

**パスパラメータ**

| パラメータ | 型       | 説明          |
| ---------- | -------- | ------------- |
| `id`       | `string` | セッション ID |

**レスポンス** `200 OK`

```json
{
  "id": "uuid-...",
  "startTime": "2026-02-24T10:05:00Z",
  "isRunning": true
}
```

> `startTime` は再開時刻にリセットされます。

---

#### `POST /api/timer/sessions/:id/save` 🔒

セッションを読書ログ・ラップとして保存し、セッションを完了状態にします。

**パスパラメータ**

| パラメータ | 型       | 説明          |
| ---------- | -------- | ------------- |
| `id`       | `string` | セッション ID |

**リクエストボディ**

```json
{
  "isbn": 9784873119038,
  "firstPage": 1,
  "lastPage": 50,
  "rating": 4,
  "laps": [
    {
      "elapsedMs": 120000,
      "note": "ここが重要",
      "refPage": 42
    }
  ]
}
```

| フィールド         | 型           | 必須 | 説明                     |
| ------------------ | ------------ | :--: | ------------------------ |
| `isbn`             | `u64`        |  ✅  | 読書した書籍の ISBN      |
| `firstPage`        | `u16`        |  ✅  | 開始ページ               |
| `lastPage`         | `u16`        |  ✅  | 終了ページ               |
| `rating`           | `u8 \| null` |  -   | 評価（0〜5）             |
| `laps`             | `LapInput[]` |  ✅  | ラップ一覧（空配列可）   |
| `laps[].elapsedMs` | `u64`        |  ✅  | 開始からの経過時間（ms） |
| `laps[].note`      | `string`     |  ✅  | メモ（空文字列可）       |
| `laps[].refPage`   | `u32`        |  ✅  | 参照ページ               |

**レスポンス** `200 OK`

```json
{
  "readingLogId": "uuid-...",
  "sessionDurationSec": 3600
}
```

| フィールド           | 型       | 説明                             |
| -------------------- | -------- | -------------------------------- |
| `readingLogId`       | `string` | 作成された読書ログの ID          |
| `sessionDurationSec` | `u64`    | サーバー計算による読書時間（秒） |

---

#### `DELETE /api/timer/sessions` 🔒

現在の未保存セッションを破棄します。

**レスポンス** `200 OK`（ボディなし）

---

### エクスポート

#### `GET /api/export` 🔒

ユーザーの全書籍・読書ログをエクスポートします。

**レスポンス** `200 OK`

```json
{
  "data": "{\"books\":[...],\"readingLogs\":[...]}"
}
```

> `data` フィールドは JSON 文字列（二重エンコード）です。パース時は `JSON.parse(response.data)` が必要です。

```ts
// パース例
const { data } = await res.json();
const { books, readingLogs } = JSON.parse(data);
```

---

## エラーレスポンス

現在、エラーは Worker の標準エラーレスポンスとして返されます。

| ケース                                 | HTTP ステータス |
| -------------------------------------- | --------------- |
| 認証エラー（セッションなし・期限切れ） | 500             |
| リソースが見つからない (`NotFound`)    | 500             |
| ユニーク制約違反                       | 500             |
| パラメータ不足                         | 500             |
| その他のサーバーエラー                 | 500             |

---

## 環境変数

| 変数名                 | 種別   | 説明                                  |
| ---------------------- | ------ | ------------------------------------- |
| `GOOGLE_CLIENT_ID`     | var    | Google OAuth クライアント ID          |
| `GOOGLE_CLIENT_SECRET` | secret | Google OAuth クライアントシークレット |
| `GOOGLE_REDIRECT_URI`  | var    | Google OAuth リダイレクト URI         |

