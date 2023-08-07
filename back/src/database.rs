use serde::{Deserialize, Serialize};
use surrealdb::engine::remote::ws::{Client, Ws};
use surrealdb::opt::auth::Root;
use surrealdb::{Result, Surreal};

const URL: &str = "localhost:8000";
const NAMESPACE: &str = "bookie_clicker";
const DATABASE: &str = "database";
const USER: &str = "root";
const PASS: &str = "root";

#[derive(Serialize, Deserialize)]
pub struct QueryData {
    user: i32,          // 登録したユーザー
    isbn: i64,          // 本のISBN
    iter: i16,          // 何周目か 1-indexed
    status: ReadStatus, // 状態。未読/読書中/読了
    category: i16,      // 本棚の通し番号
    rating: i16,        // 5段階評価
    note: String,       // 感想とか
}

#[derive(Serialize, Deserialize)]
pub enum ReadStatus {
    Read,
    Reading(ReadProgress),
    Unread,
}

pub type ReadProgress = Vec<(i16, i16)>; // 読了区間A, B……について[(A開始, A終了), (B開始, B終了)……]

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
    println!("Connecting");
    let db = Surreal::new::<Ws>(URL).await?;
    db.signin(Root {
        username: USER,
        password: PASS,
    })
    .await?;
    db.use_ns(NAMESPACE).use_db(DATABASE).await?;
    println!("Connected");
    Ok(db)
}

#[derive(Serialize, Deserialize)]
struct Test {
    s: String,
    n: i32,
}

async fn register_book(db: Surreal<Client>, query: QueryData) -> Result<()> {
    println!("Registering");
    match db
        .set(
            "book:test1",
            Test {
                s: "test".to_string(),
                n: 10,
            },
        )
        .await
    {
        Ok(_) => println!("Registered"),
        Err(e) => println!("{}", e),
    };
    Ok(())
}

pub async fn test_register_book() -> Result<()> {
    let query = QueryData {
        user: -1,
        isbn: 9784588010590,
        iter: 1,
        status: ReadStatus::Read,
        category: 0,
        rating: 3,
        note: "サイモン・クリッチリーゆるさん".to_string(),
    };
    let db = connect().await?;
    register_book(db, query).await?;
    Ok(())
}
