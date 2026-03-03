# backend-web テスト戦略ドキュメント

## 概要

`apps/backend-web` は Cloudflare Workers 上で動作するRustバックエンドです。  
Worker ランタイム（`worker` crate）に依存する箇所はユニットテストが困難なため、**純粋関数を可能な限り切り出し**、それらに対してユニットテストを実施する戦略を採用しています。

---

## アーキテクチャとモジュール構成

```
src/
├── lib.rs              # ルーター定義、CORSヘルパー
├── middleware.rs        # 認証ミドルウェア
├── models.rs           # ドメインモデル（User, Session, TimerSession, GoogleIdToken）
├── session.rs          # セッション管理（SessionManager, UserManager）
├── db/
│   ├── mod.rs          # database_from_ctx ヘルパー
│   ├── d1_adapter.rs   # D1 データベースアダプター
│   └── schema.sql      # DDL
├── handlers/
│   ├── mod.rs          # ハンドラモジュール宣言
│   ├── auth.rs         # 認証ハンドラ（Google OAuth、セッション管理）
│   ├── books.rs        # 書籍 CRUD ハンドラ
│   ├── reading_logs.rs # 読書ログ CRUD ハンドラ
│   ├── laps.rs         # ラップ CRUD ハンドラ
│   ├── timer.rs        # タイマーセッション管理ハンドラ
│   └── export.rs       # データエクスポートハンドラ
└── utils/
    ├── mod.rs
    └── errors.rs       # エラー変換ヘルパー
```

---

## テストレベル

### 1. ユニットテスト（67テスト）

各モジュール内の `#[cfg(test)] mod tests` ブロックで定義。Worker ランタイムへの依存なし。

| モジュール                 | テスト対象関数                     | テスト数 | 説明                                |
| -------------------------- | ---------------------------------- | -------- | ----------------------------------- |
| `lib.rs`                   | `is_allowed_origin`                | 10       | 許可オリジンの判定ロジック          |
| `handlers/auth.rs`         | `base64_decode`                    | 4        | Base64URL デコード                  |
| `handlers/auth.rs`         | `decode_id_token`                  | 6        | JWT ペイロードのデコード            |
| `handlers/books.rs`        | `build_isbn_filter`                | 5        | URLクエリからISBNフィルタ構築       |
| `handlers/reading_logs.rs` | `build_reading_log_filters`        | 6        | URLクエリからReadingLogフィルタ構築 |
| `handlers/reading_logs.rs` | `build_reading_log_delete_filters` | 3        | URLクエリからdelete用フィルタ構築   |
| `handlers/laps.rs`         | `extract_reading_log_id`           | 4        | URLクエリからreading_log_id抽出     |
| `handlers/laps.rs`         | `build_reading_log_for_laps`       | 2        | ラップ検索用ダミーReadingLog構築    |
| `handlers/timer.rs`        | `compute_duration`                 | 8        | タイマー時間の計算                  |
| `handlers/timer.rs`        | `convert_lap_inputs`               | 3        | LapInput → Lap 変換                 |
| `handlers/timer.rs`        | `LapInput` deserialization         | 1        | デシリアライズ検証                  |
| `handlers/export.rs`       | `build_user_scoped_query`          | 1        | ユーザースコープクエリ構築          |
| `handlers/export.rs`       | `serialize_export`                 | 3        | エクスポートJSON生成                |
| `models.rs`                | `Session::is_expired`              | 3        | セッション期限切れ判定              |
| `models.rs`                | `TimerSession` serde               | 3        | シリアライズ / デシリアライズ       |
| `utils/errors.rs`          | `handle_db_error`                  | 5        | DbError → WorkerError 変換          |

### 2. 結合テスト（E2E）

Worker ランタイムに依存するハンドラ関数や DB アダプターの結合テストは、以下の方法で実施します。

#### wrangler dev --local 環境

```bash
cd apps/backend-web
npx wrangler dev --local
```

その後、`curl` やフロントエンドの開発サーバーからHTTPリクエストを送信して検証：

| エンドポイント                         | メソッド | テスト内容                   |
| -------------------------------------- | -------- | ---------------------------- |
| `GET /health`                          | GET      | ヘルスチェック               |
| `POST /api/auth/google/callback`       | POST     | Google OAuthコールバック     |
| `GET /api/auth/me`                     | GET      | 現在ユーザー取得（認証必須） |
| `POST /api/auth/logout`                | POST     | ログアウト                   |
| `POST /api/books`                      | POST     | 書籍追加                     |
| `GET /api/books?isbn=xxx`              | GET      | 書籍検索                     |
| `DELETE /api/books?isbn=xxx`           | DELETE   | 書籍削除                     |
| `POST /api/books/search`               | POST     | NDL API書籍検索              |
| `POST /api/reading-logs`               | POST     | 読書ログ追加                 |
| `GET /api/reading-logs?isbn=xxx`       | GET      | 読書ログ検索                 |
| `DELETE /api/reading-logs?id=xxx`      | DELETE   | 読書ログ削除                 |
| `POST /api/laps`                       | POST     | ラップ一括追加               |
| `GET /api/laps?reading_log_id=xxx`     | GET      | ラップ検索                   |
| `DELETE /api/laps/:id`                 | DELETE   | ラップ削除                   |
| `POST /api/timer/sessions`             | POST     | タイマーセッション開始       |
| `GET /api/timer/sessions/current`      | GET      | 現在セッション取得           |
| `PATCH /api/timer/sessions/:id/stop`   | PATCH    | セッション停止               |
| `PATCH /api/timer/sessions/:id/resume` | PATCH    | セッション再開               |
| `POST /api/timer/sessions/:id/save`    | POST     | セッション保存               |
| `DELETE /api/timer/sessions`           | DELETE   | セッションリセット           |
| `GET /api/export`                      | GET      | データエクスポート           |

---

## テスト実行方法

```bash
# ユニットテスト
cd apps/backend-web
cargo test

# Clippy チェック
cargo clippy -- -D warnings
```

---

## 純粋関数の切り出し方針

1. **URLクエリパラメータの解析** → `build_isbn_filter`, `build_reading_log_filters` 等
2. **データ変換** → `convert_lap_inputs`, `serialize_export` 等
3. **時間計算** → `compute_duration`
4. **バリデーション/デコード** → `decode_id_token`, `base64_decode`
5. **ダミーデータ構築** → `build_reading_log_for_laps`
6. **エラー変換** → `handle_db_error`

---

## 制約事項

- `worker::Request`, `worker::RouteContext`, `worker::D1Database` 等のWorkerランタイム型はnative targetではモック不可
- `wasm32-unknown-unknown` ターゲットでのみ動作する機能は `#[cfg(target_arch = "wasm32")]` で分岐
- ユニットテストは `#[cfg(test)]` で native target 向けに記述
- ハンドラ関数そのもの（`google_callback`, `add_book` 等）はWorkerランタイム依存のためユニットテスト対象外

