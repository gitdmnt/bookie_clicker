# Bookie Web Backend

Cloudflare Workers + D1で動作する読書記録アプリケーションのWebバックエンドです。

## 技術スタック

- **Runtime**: Cloudflare Workers (Wasm)
- **Database**: D1 (SQLite)
- **Language**: Rust (worker-rs)
- **Core Logic**: bookie_core (共通ドメインロジック)

## セットアップ

### 前提条件

- Rust 1.70+
- wrangler CLI
- Cloudflare アカウント

### インストール

```bash
# Worker buildツールのインストール
cargo install worker-build

# D1データベースの作成
wrangler d1 create bookie

# wrangler.tomlのdatabase_idを更新
# [[d1_databases]]
# binding = "DB"
# database_name = "bookie"
# database_id = "<your-database-id>"

# スキーマの適用
wrangler d1 execute bookie --file=./src/db/schema.sql
```

### ローカル開発

```bash
# ローカルでWorkerを起動
wrangler dev

# または
npm run dev
```

### デプロイ

```bash
wrangler deploy
```

## API エンドポイント

### ヘルスチェック

- `GET /` - API サーバー確認
- `GET /health` - ヘルスチェック

### 認証

- `POST /api/auth/google/callback` - Google OAuthコールバック
- `GET /api/auth/me` - 現在のユーザー取得
- `POST /api/auth/logout` - ログアウト

### 書籍操作

- `POST /api/books` - 書籍を追加
- `GET /api/books?isbn=123` - 書籍を検索
- `DELETE /api/books?isbn=123` - 書籍を削除
- `POST /api/books/search` - NDL APIで検索
- `POST /api/isbn/parse` - ISBN文字列をパース

### 読書ログ操作

- `POST /api/reading-logs` - 読書ログを追加
- `GET /api/reading-logs?isbn=123&id=abc` - 読書ログを検索
- `DELETE /api/reading-logs?id=abc` - 読書ログを削除

### ラップ操作

- `POST /api/laps` - ラップを追加（バッチ）
- `GET /api/laps?reading_log_id=abc` - ラップを検索
- `DELETE /api/laps/:id` - ラップを削除

### エクスポート

- `GET /api/export` - データベース全体をエクスポート

### タイマーセッション操作

- `POST /api/timer/sessions` - タイマーセッション開始
- `GET /api/timer/sessions/current` - 現在の未保存セッションを取得
- `PATCH /api/timer/sessions/:id/stop` - セッション停止
- `PATCH /api/timer/sessions/:id/resume` - セッション再開
- `POST /api/timer/sessions/:id/save` - セッション保存（reading_log + laps 作成）
- `DELETE /api/timer/sessions` - 未保存セッションをリセット

## アーキテクチャ

```
src/
├── lib.rs              # Worker entry point, Router setup, CORS
├── middleware.rs        # 認証ミドルウェア (require_auth)
├── models.rs           # ドメインモデル (User, Session, TimerSession, GoogleIdToken)
├── session.rs          # セッション・ユーザー管理 (SessionManager, UserManager)
├── db/
│   ├── mod.rs          # database_from_ctx ヘルパー
│   ├── d1_adapter.rs   # D1 DatabasePort 実装
│   └── schema.sql      # D1 テーブル定義
├── handlers/
│   ├── mod.rs
│   ├── auth.rs         # 認証ハンドラ (Google OAuth, セッション)
│   ├── books.rs        # Book CRUD ハンドラ
│   ├── reading_logs.rs # ReadingLog CRUD ハンドラ
│   ├── laps.rs         # Lap CRUD ハンドラ
│   ├── timer.rs        # タイマーセッション管理ハンドラ
│   └── export.rs       # エクスポートハンドラ
└── utils/
    ├── mod.rs
    └── errors.rs       # エラー変換ヘルパー
```

### 設計原則

- **ドメイン駆動設計**: `bookie_core` のドメインモデルを活用
- **Ports & Adapters**: `DatabasePort` trait を D1 で実装
- **Wasm 互換性**: `?Send` マーカーで非同期トレイトを対応

## フロントエンド統合

フロントエンドは環境検出により自動的にTauri/Web APIを切り替えます。

```typescript
// frontend/src/utils/api.ts
import { isTauri } from "./env-detect";
import * as TauriAPI from "./api-tauri";
import * as WebAPI from "./api-web";

const api = isTauri() ? TauriAPI : WebAPI;

export const addBook = api.addBook;
// ...
```

環境変数でAPIベースURLを設定:

```bash
# .env
VITE_API_BASE_URL=https://your-worker.workers.dev
```

## データベーススキーマ

### books テーブル

| カラム       | 型      | 説明                         |
| ------------ | ------- | ---------------------------- |
| isbn         | INTEGER | 主キー                       |
| title        | TEXT    | タイトル                     |
| series_title | TEXT    | シリーズタイトル（nullable） |
| authors      | TEXT    | 著者配列（JSON）             |
| publisher    | TEXT    | 出版社                       |
| year         | INTEGER | 出版年                       |
| page_count   | INTEGER | ページ数                     |
| image_url    | TEXT    | 画像URL                      |
| created_at   | TEXT    | 作成日時（RFC3339）          |

### reading_logs テーブル

| カラム               | 型      | 説明                   |
| -------------------- | ------- | ---------------------- |
| id                   | TEXT    | 主キー（ULID）         |
| isbn                 | INTEGER | 外部キー → books(isbn) |
| created_at           | TEXT    | 作成日時（RFC3339）    |
| session_duration_sec | INTEGER | セッション時間（秒）   |
| page_start           | INTEGER | 開始ページ             |
| page_end             | INTEGER | 終了ページ             |
| rating               | INTEGER | 評価（0-5、nullable）  |

### laps テーブル

| カラム         | 型      | 説明                        |
| -------------- | ------- | --------------------------- |
| id             | TEXT    | 主キー（ULID）              |
| reading_log_id | TEXT    | 外部キー → reading_logs(id) |
| elapsed_ms     | INTEGER | 経過時間（ミリ秒）          |
| note           | TEXT    | メモ（nullable）            |
| ref_page       | INTEGER | 参照ページ（nullable）      |
| created_at     | TEXT    | 作成日時（RFC3339）         |

## 開発状況

### 実装済み

- ✅ D1 DatabasePort 実装
- ✅ CRUD エンドポイント（books, reading_logs, laps）
- ✅ QueryBuilder → SQL 変換
- ✅ エラーハンドリング
- ✅ エクスポート機能
- ✅ フロントエンド抽象化レイヤー
- ✅ Google OAuth 認証・認可
- ✅ セッション管理（Bearer Token方式）
- ✅ CORS設定（FRONTEND_ORIGINS 環境変数対応）
- ✅ タイマーセッション管理
- ✅ NDL API 検索実装（WorkerHttpClient アダプター）
- ✅ ユニットテスト（67テスト）
- ✅ 純粋関数への切り出しリファクタリング

### テスト

テスト戦略の詳細は [`docs/BACKEND_WEB_TESTING.md`](../../docs/BACKEND_WEB_TESTING.md) を参照。

```bash
# ユニットテスト
cargo test

# Clippy チェック
cargo clippy -- -D warnings
```

### TODO

- ⬜ レート制限
- ⬜ wrangler dev --local を使用した結合テスト自動化

## ライセンス

このプロジェクトのライセンスについては、リポジトリルートのLICENSEファイルを参照してください。

