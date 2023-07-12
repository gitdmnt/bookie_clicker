use reqwest;

const URL: &str = "ws://localhost:8000";
const NAMESPACE: &str = "bookie_clicker";
const DATABASE: &str = "database";
const USER: &str = "root";
const PASS: &str = "root";

pub struct QueryData {
    user: i32,                 // 登録したユーザー
    isbn: i64,                 // 本のISBN
    iter: i16,                 // 何周目か 1-indexed
    status: i16,               // 状態。未読/読書中/読了
    progress: Vec<(i16, i16)>, // 読了区間A, B……について[(A開始, A終了), (B開始, B終了)……]
    category: i16,             // 本棚の通し番号
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

async fn register() {
    todo!()
}
