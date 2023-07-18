use serde::Serialize;
use surrealdb::engine::remote::ws::{Client, Ws};
use surrealdb::opt::auth::Root;
use surrealdb::{Result, Surreal};

const URL: &str = "ws://localhost:8000";
const NAMESPACE: &str = "bookie_clicker";
const DATABASE: &str = "database";
const USER: &str = "root";
const PASS: &str = "root";

#[derive(Serialize)]
pub struct QueryData {
    user: i32,                 // 登録したユーザー
    isbn: i64,                 // 本のISBN
    iter: i16,                 // 何周目か 1-indexed
    status: i16,               // 状態。未読/読書中/読了
    progress: Vec<(i16, i16)>, // 読了区間A, B……について[(A開始, A終了), (B開始, B終了)……]
    category: i16,             // 本棚の通し番号
    rating: i16,               // 5段階評価
    note: String,              // 感想とか
}

pub struct UserData {
    id: u32,                 // ユーザーID
    name: String,            // ユーザー名
    address: String,         // メールアドレス
    password: String,        // パスワード
    salt: String,            // ソルト
    categories: Vec<String>, // カテゴリー
    registered_date: String, // 登録年月日
}

async fn connect() -> Result<Surreal<Client>> {
    let db = Surreal::new::<Ws>(URL).await?;
    db.signin(Root {
        username: USER,
        password: PASS,
    })
    .await?;
    db.use_ns(NAMESPACE).use_db(DATABASE).await?;
    Ok(db)
}

async fn register_book(db: Surreal<Client>, query: QueryData) -> Result<()> {
    db.set("test1", 0).await?;
    Ok(())
}
