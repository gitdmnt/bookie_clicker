# DB抽象化レイヤー設計

## 概要

Bookie ClickerのDB層を抽象化し、TauriのSurrealDBとWebバックエンドの異なるDBを透過的に扱えるようにしました。

## アーキテクチャ

### 3層構造

```
┌─────────────────────────────────────────┐
│  Commands Layer (Tauri/Web Handlers)     │
│  - エラー型: String (Tauri互換)          │
└─────────────────┬───────────────────────┘
                  │ uses DatabasePort trait
┌─────────────────▼───────────────────────┐
│  Core Abstraction (packages/core/ports) │
│  - DatabasePort trait                   │
│  - DbError (統一エラー型)                │
│  - QueryBuilder (DB非依存クエリ)         │
└─────────────────┬───────────────────────┘
                  │ implemented by
┌─────────────────▼───────────────────────┐
│  DB Implementation Layer                │
│  - SurrealDatabase (Tauri)              │
│  - SqliteDatabase (Web - 未実装)         │
└─────────────────────────────────────────┘
```

## コアコンポーネント

### 1. DatabasePort トレイト

**場所**: [packages/core/src/ports/mod.rs](../packages/core/src/ports/mod.rs)

```rust
#[async_trait]
pub trait DatabasePort: Send + Sync {
    // Book操作
    async fn add_book(&self, book: Book) -> Result<(), DbError>;
    async fn find_books(&self, query: QueryBuilder) -> Result<Vec<Book>, DbError>;
    async fn delete_books(&self, query: QueryBuilder) -> Result<(), DbError>;

    // ReadingLog操作
    async fn add_reading_log(&self, log: ReadingLog) -> Result<String, DbError>; // IDを返す
    async fn find_reading_logs(&self, query: QueryBuilder) -> Result<Vec<ReadingLog>, DbError>;
    async fn delete_reading_logs(&self, query: QueryBuilder) -> Result<(), DbError>;

    // Lap操作
    async fn add_laps(&self, reading_log: ReadingLog, laps: Vec<Lap>) -> Result<(), DbError>;
    async fn find_laps(&self, reading_log: ReadingLog) -> Result<Vec<Lap>, DbError>;
    async fn delete_lap(&self, id: String) -> Result<(), DbError>;

    // ユーティリティ
    async fn export_all(&self) -> Result<(Vec<Book>, Vec<ReadingLog>), DbError>;
}
```

### 2. DbError 列挙型

**場所**: [packages/core/src/ports/mod.rs](../packages/core/src/ports/mod.rs#L15-L25)

```rust
pub enum DbError {
    NotFound,
    UniqueConstraint(String),
    Transaction(String),
    Query(String),
    Connection(String),
}
```

**変換戦略**:
- SurrealDB の `surrealdb::Error` → `DbError::Query(e.to_string())`
- コマンド層で `DbError` → `String` (Tauri互換)

### 3. QueryBuilder

**場所**: [packages/core/src/ports/mod.rs](../packages/core/src/ports/mod.rs#L42-L80)

DB非依存のクエリ構築API:

```rust
pub struct QueryBuilder {
    pub filters: Vec<Filter>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

pub enum Filter {
    Eq(String, FilterValue),
    Gte(String, FilterValue),
    Lte(String, FilterValue),
    Contains(String, String),
}
```

**使用例**:
```rust
let query = QueryBuilder::new()
    .filter(Filter::Eq("isbn".to_string(), FilterValue::U64(1234567890)))
    .limit(10);

let books = db.find_books(query).await?;
```

## SurrealDatabase実装

**場所**: [apps/tauri/src-tauri/src/db/mod.rs](../apps/tauri/src-tauri/src/db/mod.rs)

### 主要な設計決定

#### 1. ID管理の統一

**問題**: SurrealDBは `table:id` 形式のRecordIdを使用

**解決策**:
- `*ForStore` 型 (ReadingLogForStore, LapForStore) で内部的にRecordIdを管理
- DatabasePortの公開APIでは常に `String` 型のIDを使用
- 変換は実装内部で自動処理

```rust
// core::ReadingLog (公開API)
pub struct ReadingLog {
    pub id: Option<String>, // "reading_logs:ulid_xxx"
    // ...
}

// ReadingLogForStore (SurrealDB内部)
struct ReadingLogForStore {
    pub id: Option<RecordId>, // Thing型
    // ...
}
```

#### 2. QueryBuilder → SurrealQL変換

**実装**: `query_builder_to_where_clause()` ヘルパー関数

```rust
fn query_builder_to_where_clause(builder: &QueryBuilder) -> Option<String> {
    // Filter::Eq("isbn", U64(123)) → "isbn = 123"
    // Filter::Gte("date", U32(20240101)) → "date >= 20240101"
    // ...
}
```

**生成例**:
```rust
QueryBuilder { filters: [Eq("isbn", U64(123))], limit: Some(10) }
↓
"SELECT * FROM books WHERE isbn = 123 LIMIT 10"
```

#### 3. トランザクション的操作

**`add_laps` の実装**:
```rust
async fn add_laps(&self, reading_log: ReadingLog, laps: Vec<Lap>) -> Result<(), DbError> {
    // 1. ReadingLogのIDを取得または作成
    let id = match &reading_log.id {
        Some(id) => RecordId::from_str(id)?,
        None => {
            // ReadingLogを作成してIDを取得
            let created: Option<ReadingLogForStore> = db.create("reading_logs")...
            created.id.unwrap()
        }
    };

    // 2. 各Lapを作成（失敗時はDbError::Transactionを返す）
    for lap in laps {
        let mut lap_store: LapForStore = lap.into();
        lap_store.reading_log = Some(id.clone()); // 親IDをセット
        db.create("laps").content(lap_store).await?;
    }
}
```

**注意**: 現状はSurrealDBのトランザクション機能を使っていないため、部分的な失敗時のロールバックは未実装。

## コマンド層の移行

**場所**: [apps/tauri/src-tauri/src/commands/db.rs](../apps/tauri/src-tauri/src/commands/db.rs)

### 変更点

**Before**:
```rust
#[tauri::command]
pub async fn add_book(db: State<'_, Database>, book: Book) -> Result<(), surrealdb::Error> {
    db.add_book(book).await
}
```

**After**:
```rust
#[tauri::command]
pub async fn add_book(db: State<'_, Database>, book: Book) -> Result<(), String> {
    DatabasePort::add_book(db.inner(), book)
        .await
        .map_err(|e| e.to_string())
}
```

**理由**:
- Tauriコマンドは `surrealdb::Error` を直接返せない（シリアライズ不可）
- `String` エラーに統一することでフロントエンドとの互換性を維持

## レガシー互換性

### Database型エイリアス

**場所**: [apps/tauri/src-tauri/src/db/mod.rs](../apps/tauri/src-tauri/src/db/mod.rs#L23)

```rust
pub type Database = SurrealDatabase;
```

**効果**:
- 既存のコマンド層コードは `Database` 型を継続使用可能
- 段階的な移行が可能

### レガシーメソッド

SurrealDatabaseは以下のレガシーメソッドを保持（未使用警告あり）:
- `add_book` (surrealdb::Error版)
- `select_books` (Query版)
- `select_reading_logs` (Query版)
- `export` (PathBuf版)

**移行後の削除候補**:
```rust
// TODO: 完全移行後に削除
impl SurrealDatabase {
    pub async fn add_book(&self, book: Book) -> Result<(), surrealdb::Error> { /* ... */ }
    pub async fn select_books(&self, query: Query) -> Result<Vec<Book>, surrealdb::Error> { /* ... */ }
    // ...
}
```

## Webバックエンド実装ガイド (未実装)

### 想定スタック: Cloudflare Workers + D1

**場所**: `apps/backend-web/src/db/sqlite.rs` (予定)

```rust
use worker::*;
use bookie_core::ports::{DatabasePort, DbError, QueryBuilder};

pub struct SqliteDatabase {
    d1: D1Database,
}

#[async_trait]
impl DatabasePort for SqliteDatabase {
    async fn add_book(&self, book: Book) -> Result<(), DbError> {
        let stmt = self.d1.prepare("INSERT INTO books (isbn, title, ...) VALUES (?, ?, ...)");
        let query = stmt.bind(&[
            book.isbn.into(),
            book.title.into(),
            // ...
        ])?;
        query.run().await?;
        Ok(())
    }

    async fn find_books(&self, query: QueryBuilder) -> Result<Vec<Book>, DbError> {
        let (sql, params) = query_builder_to_sql(&query, "books");
        // "SELECT * FROM books WHERE isbn = ? LIMIT ?"
        let stmt = self.d1.prepare(&sql);
        let result = stmt.bind(&params)?.all().await?;
        // JSON → Vec<Book> 変換
        Ok(result.results()?)
    }

    // ...
}

fn query_builder_to_sql(builder: &QueryBuilder, table: &str) -> (String, Vec<JsValue>) {
    // Filter → SQL WHERE句 + パラメータ配列
    // Filter::Eq("isbn", U64(123)) → ("isbn = ?", [123])
}
```

### ID生成戦略

**オプション1: UUID v7**
```rust
use uuid::Uuid;

async fn add_reading_log(&self, log: ReadingLog) -> Result<String, DbError> {
    let id = Uuid::now_v7().to_string();
    self.d1.prepare("INSERT INTO reading_logs (id, ...) VALUES (?, ...)")
        .bind(&[id.clone().into(), /* ... */])?
        .run().await?;
    Ok(id)
}
```

**オプション2: INTEGER AUTOINCREMENT**
```sql
CREATE TABLE reading_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- ...
);
```
```rust
let result = stmt.run().await?;
let id = result.last_insert_id().to_string();
Ok(id)
```

### リレーション変換

**SurrealDB**:
```sql
SELECT * FROM laps WHERE readingLog = type::Thing("reading_logs:abc123")
```

**SQLite**:
```sql
SELECT * FROM laps WHERE reading_log_id = 'abc123'
```

**変換ロジック**:
```rust
async fn find_laps(&self, reading_log: ReadingLog) -> Result<Vec<Lap>, DbError> {
    let id = reading_log.id.ok_or(DbError::Query("No ID".to_string()))?;
    
    // SurrealDBの "reading_logs:abc" → SQLiteの "abc"
    let raw_id = id.split(':').nth(1).unwrap_or(&id);
    
    let stmt = self.d1.prepare("SELECT * FROM laps WHERE reading_log_id = ?");
    // ...
}
```

## マイグレーション管理 (未実装)

### 提案: スキーマバージョニング

**場所**: `packages/core/src/ports/migration.rs` (予定)

```rust
pub trait MigrationPort: Send + Sync {
    async fn current_version(&self) -> Result<u32, DbError>;
    async fn apply_migration(&self, version: u32, sql: &str) -> Result<(), DbError>;
}

// SurrealDB実装
impl MigrationPort for SurrealDatabase {
    async fn apply_migration(&self, version: u32, sql: &str) -> Result<(), DbError> {
        // DEFINE INDEX unique_isbn ON books FIELDS isbn UNIQUE;
        self.db.query(sql).await?;
        // バージョンをメタテーブルに保存
        Ok(())
    }
}

// SQLite実装
impl MigrationPort for SqliteDatabase {
    async fn apply_migration(&self, version: u32, sql: &str) -> Result<(), DbError> {
        // CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
        self.d1.exec(sql).await?;
        Ok(())
    }
}
```

## テスト戦略

### 単体テスト (未実装)

**場所**: `packages/core/src/ports/mod.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    struct MockDatabase {
        books: Vec<Book>,
    }

    #[async_trait]
    impl DatabasePort for MockDatabase {
        async fn add_book(&self, book: Book) -> Result<(), DbError> {
            self.books.push(book);
            Ok(())
        }
        // ...
    }

    #[tokio::test]
    async fn test_add_book() {
        let db = MockDatabase { books: vec![] };
        let book = Book { /* ... */ };
        db.add_book(book).await.unwrap();
        assert_eq!(db.books.len(), 1);
    }
}
```

### 統合テスト

**SurrealDB**: `apps/tauri/src-tauri/tests/db_integration.rs`
**SQLite**: `apps/backend-web/tests/db_integration.rs`

## パフォーマンス考慮事項

### クエリ最適化

**現状**: すべてのクエリが `SELECT *` を使用

**改善案**:
```rust
pub struct QueryBuilder {
    pub table: Table,
    pub filters: Vec<Filter>,
    pub select_fields: Option<Vec<String>>, // 追加
    pub limit: Option<u32>,
}

// 使用例
QueryBuilder::new()
    .select_fields(vec!["id", "isbn", "title"]) // 必要なフィールドのみ
    .filter(Filter::Eq("isbn", FilterValue::U64(123)))
```

### バッチ挿入

**現状**: `add_laps` は各Lapを個別にINSERT

**改善案**:
```rust
async fn add_laps_batch(&self, laps: Vec<(ReadingLog, Vec<Lap>)>) -> Result<(), DbError> {
    // トランザクション内でバッチINSERT
}
```

## セキュリティ考慮事項

### SQLインジェクション対策

**SurrealDB**: クエリビルダーで値をエスケープ

**SQLite**: パラメータ化クエリを使用
```rust
// NG: 直接文字列連結
let sql = format!("SELECT * FROM books WHERE title = '{}'", title);

// OK: パラメータバインディング
let stmt = db.prepare("SELECT * FROM books WHERE title = ?");
stmt.bind(&[title.into()])
```

### アクセス制御

**TODO**: DatabasePortに認証・認可レイヤーを追加
```rust
pub trait DatabasePort: Send + Sync {
    async fn with_user(&self, user_id: String) -> Box<dyn DatabasePort>;
}
```

## 既知の制限

1. **トランザクションサポート不完全**: `add_laps` の部分的な失敗時のロールバックなし
2. **クエリ機能制限**: WHERE句のみ、ORDER BY/JOINなし
3. **マイグレーション未実装**: スキーマバージョン管理なし
4. **エラー詳細度**: `DbError::Query(String)` で詳細なエラー種別が失われる

## 今後の拡張

### Phase 1: トランザクション抽象化
```rust
#[async_trait]
pub trait TransactionPort: Send + Sync {
    async fn begin(&self) -> Result<Box<dyn TransactionPort>, DbError>;
    async fn commit(&self) -> Result<(), DbError>;
    async fn rollback(&self) -> Result<(), DbError>;
}
```

### Phase 2: クエリビルダー拡張
```rust
QueryBuilder::new()
    .filter(Filter::Eq("isbn", FilterValue::U64(123)))
    .order_by("created_at", Order::Desc)
    .join("reading_logs", "books.isbn = reading_logs.isbn")
```

### Phase 3: マイグレーションツール
```bash
$ bookie-migrate generate "add_rating_to_books"
Created migration: migrations/003_add_rating_to_books.sql

$ bookie-migrate up
Applied migration 003: add_rating_to_books
```

## 参考資料

- [SurrealDB クエリ言語](https://surrealdb.com/docs/surrealql)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Rust async-trait](https://github.com/dtolnay/async-trait)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
