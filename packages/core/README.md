# Bookie Core

読書記録アプリケーションのコアドメインロジックを提供するライブラリです。ドメイン駆動設計（DDD）とヘキサゴナルアーキテクチャの原則に基づいて設計されています。

## アーキテクチャ

```
packages/core/src/
├── domain/              # ドメイン層（ビジネスロジック）
│   ├── book.rs         # 書籍エンティティ
│   ├── isbn.rs         # ISBNバリューオブジェクト
│   ├── reading_log.rs  # 読書記録エンティティ
│   └── services/       # ドメインサービス
│       └── reading_session.rs  # 読書セッション管理
├── application/         # アプリケーション層（ユースケース）
│   └── book_search.rs  # 書籍検索サービス
└── ports/              # ポート（インターフェース定義）
    └── mod.rs          # DatabasePort, HttpClient, Clock traits
```

### 設計原則

- **ドメイン駆動設計**: ビジネスロジックをドメイン層に集約
- **ヘキサゴナルアーキテクチャ**: ポート&アダプターパターンによる依存性逆転
- **レイヤー分離**: ドメイン層はインフラストラクチャに依存しない

## ドメインモデル

### エンティティ（Entities）

#### Book（書籍）
```rust
pub struct Book {
    pub isbn: u64,              // 主キー
    pub title: String,
    pub series_title: Option<String>,
    pub authors: Vec<String>,
    pub publisher: String,
    pub year: u32,
    pub page_count: u32,
    pub image_url: String,
    pub created_at: String,
}
```

**メソッド:**
- `new()` - 書籍を作成
- `validate()` - ビジネスルールの検証

**ビジネスルール:**
- ISBNは0以外
- タイトルは空でない
- 少なくとも1人の著者が必要

#### ReadingLog（読書記録）
```rust
pub struct ReadingLog {
    pub id: Option<String>,
    pub isbn: u64,
    pub created_at: String,
    pub session_duration_sec: u64,
    pub page: [u16; 2],         // [開始ページ, 終了ページ]
    pub rating: Option<u8>,
}
```

**メソッド:**
- `new()` - 読書記録を作成
- `validate()` - ビジネスルールの検証
- `pages_read()` - 読了ページ数を計算

**ビジネスルール:**
- ISBNは0以外
- 開始ページ ≤ 終了ページ
- 評価は0〜5の範囲

#### Lap（ラップ）
```rust
pub struct Lap {
    pub id: Option<String>,
    pub elapsed_ms: u64,
    pub note: Option<String>,
    pub ref_page: Option<u32>,
    pub created_at: String,
}
```

読書セッション中のチェックポイントを表現します。

### バリューオブジェクト（Value Objects）

#### Isbn
```rust
pub struct Isbn(u64);
```

ISBN（国際標準図書番号）を表すバリューオブジェクト。不変性とバリデーションを保証します。

**メソッド:**
- `new(value: u64)` - ISBN-13から作成
- `parse(input: &str)` - ISBN-10またはISBN-13文字列から作成
- `value()` - u64値を取得
- `as_string()` - 文字列として取得

**機能:**
- ISBN-10からISBN-13への自動変換
- チェックサムの検証
- ハイフンやスペースの自動削除

### ドメインサービス（Domain Services）

#### ReadingSession
```rust
pub struct ReadingSession {
    pub running: bool,
    start_instant: Option<Instant>,
    elapsed: Duration,
    laps: Vec<Lap>,
}
```

読書セッションの状態を管理する純粋なドメインサービス。フレームワークに依存しません。

**メソッド:**
- `new()` - 新しいセッションを作成
- `start()` - セッションを開始
- `stop()` - セッションを停止
- `reset()` - セッションをリセット
- `elapsed_ms()` - 経過時間（ミリ秒）を取得
- `add_lap()` - ラップを追加
- `get_laps()` - ラップのリストを取得

## アプリケーションサービス

### BookSearch

NDL（国立国会図書館）APIを使用した書籍検索のユースケースを実装します。

```rust
pub async fn search_book_by_isbn<C: HttpClient, K: Clock>(
    isbn: &str,
    client: &C,
    clock: &K,
) -> Result<Vec<Book>, String>
```

**責務:**
- ISBNのパースと検証
- NDL APIへのHTTPリクエスト
- XMLレスポンスのパース
- Bookエンティティへの変換

## ポート（Ports）

### DatabasePort

データベース操作の抽象化インターフェース。

```rust
#[async_trait]
pub trait DatabasePort: Send + Sync {
    // Book operations
    async fn add_book(&self, book: Book) -> Result<(), DbError>;
    async fn find_books(&self, query: QueryBuilder) -> Result<Vec<Book>, DbError>;
    async fn delete_books(&self, query: QueryBuilder) -> Result<(), DbError>;

    // ReadingLog operations
    async fn add_reading_log(&self, log: ReadingLog) -> Result<String, DbError>;
    async fn find_reading_logs(&self, query: QueryBuilder) -> Result<Vec<ReadingLog>, DbError>;
    async fn delete_reading_logs(&self, query: QueryBuilder) -> Result<(), DbError>;

    // Lap operations
    async fn add_laps(&self, reading_log: ReadingLog, laps: Vec<Lap>) -> Result<(), DbError>;
    async fn find_laps(&self, reading_log: ReadingLog) -> Result<Vec<Lap>, DbError>;
    async fn delete_lap(&self, id: String) -> Result<(), DbError>;

    // Utility operations
    async fn export_all(&self) -> Result<(Vec<Book>, Vec<ReadingLog>), DbError>;
}
```

### HttpClient

HTTP通信の抽象化インターフェース。

```rust
#[async_trait]
pub trait HttpClient: Send + Sync {
    async fn get_text(&self, url: &str) -> Result<String, String>;
}
```

### Clock

時刻取得の抽象化インターフェース。

```rust
pub trait Clock: Send + Sync {
    fn now_rfc3339(&self) -> String;
}
```

## QueryBuilder

柔軟なクエリ構築のためのビルダーパターン実装。

```rust
let query = QueryBuilder::new()
    .filter(Filter::Eq("isbn".to_string(), FilterValue::U64(9784873119038)))
    .filter(Filter::Gte("year".to_string(), FilterValue::U32(2020)))
    .limit(10)
    .offset(0);
```

**フィルタ種類:**
- `Eq` - 等価
- `Gte` - 以上
- `Lte` - 以下
- `Contains` - 部分一致

**FilterValue型:**
- `String(String)`
- `U64(u64)`
- `U32(u32)`
- `U16(u16)`
- `U8(u8)`

## エラーハンドリング

### DbError

データベース操作のエラーを表現する型。

```rust
pub enum DbError {
    NotFound,
    UniqueConstraint(String),
    Transaction(String),
    Query(String),
    Connection(String),
}
```

## 使用例

### 書籍の検索

```rust
use bookie_core::application::search_book_by_isbn;
use bookie_core::ports::{HttpClient, Clock};

let books = search_book_by_isbn("978-4-87311-903-8", &client, &clock).await?;
```

### 読書セッションの管理

```rust
use bookie_core::domain::ReadingSession;

let mut session = ReadingSession::new();
session.start()?;

// ... 読書中 ...

let lap = session.add_lap(
    Some("第3章まで読了".to_string()),
    Some(150),
    clock.now_rfc3339()
);

session.stop()?;
let total_ms = session.elapsed_ms();
```

### データベース操作

```rust
use bookie_core::domain::Book;
use bookie_core::ports::{DatabasePort, QueryBuilder, Filter, FilterValue};

// 書籍を追加
let book = Book::new(
    9784873119038,
    "プログラミングRust".to_string(),
    vec!["Jim Blandy".to_string()],
    "オライリー・ジャパン".to_string(),
    2018,
    600,
    "https://example.com/image.jpg".to_string(),
    "2024-01-01T00:00:00Z".to_string(),
);
db.add_book(book).await?;

// 書籍を検索
let query = QueryBuilder::new()
    .filter(Filter::Eq("isbn".to_string(), FilterValue::U64(9784873119038)));
let books = db.find_books(query).await?;
```

## テスト

```bash
cargo test
```

**テスト数:** 44個のテストが含まれています

- ドメインロジックのユニットテスト
- ISBNバリデーションのテスト
- XMLパーサーのテスト
- QueryBuilderのテスト

## 依存関係

- `async-trait` - 非同期トレイト定義
- `serde` - シリアライゼーション
- `quick-xml` - XMLパース
- `time` - 時刻処理

## ライセンス

このプロジェクトのライセンスについては、リポジトリルートのLICENSEファイルを参照してください。
