use std::fs;
use std::path::PathBuf;
use tauri::async_runtime::Mutex;

use serde::{Deserialize, Serialize};
use surrealdb::engine::local::{Db, RocksDb};
use surrealdb::Surreal;

pub struct Database {
    path: PathBuf,
    db: Mutex<Surreal<Db>>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "content", rename_all_fields = "camelCase")]
pub enum Element {
    Book {
        isbn: u64,
        title: String,
        authors: Vec<String>,
        publisher: String,
        year: u16,
        page_count: u16,
        image_url: String,
    },
    ReadingLog {
        user: u64,
        isbn: u64,
    },
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Query {
    // メタデータ
    #[serde(deserialize_with = "element_deserializer")]
    element_type: Element,
    user: Option<u64>,
    date_from: Option<u32>,
    date_to: Option<u32>,

    // Book の場合
    isbn: Option<u64>, // Primary Key
    title: Option<String>,
    author: Option<String>,
    publisher: Option<String>,
    // ReadingLog の場合
}

impl Database {
    pub async fn connect(path: String) -> Result<Database, surrealdb::Error> {
        let path = dirs::data_dir().unwrap().join("bookie_clicker").join(path);
        let db = Surreal::new::<RocksDb>(path.clone()).await?;

        // 名前空間・データベースの指定
        db.use_ns("bookie_clicker").use_db("bookie_clicker").await?;

        let db = Mutex::new(db);

        Ok(Database { path, db })
    }

    pub async fn export(&self) -> Result<(), Box<dyn std::error::Error>> {
        let db = self.db.lock().await;
        let export_data = db.query("SELECT * FROM books");
        let export_data: Vec<Element> = export_data.await?.take(0)?;
        let json = serde_json::to_string_pretty(&export_data)?;
        let path = &self.path.join("lib.json");
        fs::write(path, json)?;

        println!("Database exported to bookie_clicker_export.json");

        Ok(())
    }

    pub async fn add(&self, e: Element) -> Result<(), surrealdb::Error> {
        let db = self.db.lock().await;
        let table = match e {
            Element::Book { .. } => "books",
            Element::ReadingLog { .. } => "reading_logs",
        };
        let _: Option<Element> = db.create(table).content(e).await?;

        Ok(())
    }

    pub async fn select(&self, query: Query) -> Result<Vec<Element>, surrealdb::Error> {
        let query = query.to_string();
        let db = self.db.lock().await;
        db.query(query).await?.take::<Vec<Element>>(0)
    }

    pub async fn delete(&self, query: Query) -> Result<(), surrealdb::Error> {
        let query = query.to_delete();
        let db = self.db.lock().await;
        let _ = db.query(query).await?;
        Ok(())
    }
}

impl Element {
    fn empty_element(t: &str) -> Element {
        match t {
            "Book" => Element::empty_book(),
            "ReadingLog" => Element::empty_reading_log(),
            _ => panic!("Invalid table name"),
        }
    }
    fn empty_book() -> Element {
        Element::Book {
            isbn: 0,
            title: "".to_string(),
            authors: vec![],
            publisher: "".to_string(),
            year: 0,
            page_count: 0,
            image_url: "".to_string(),
        }
    }
    fn empty_reading_log() -> Element {
        Element::ReadingLog { user: 0, isbn: 0 }
    }
}

fn element_deserializer<'de, D>(deserializer: D) -> Result<Element, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(serde::Deserialize)]
    struct Helper {
        #[serde(rename = "type")]
        element_type: String,
        #[serde(rename = "content", skip)]
        _content: serde_json::Value,
    }

    let helper = Helper::deserialize(deserializer)?;
    Ok(Element::empty_element(&helper.element_type))
}

impl std::fmt::Display for Query {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let query = format!("SELECT * FROM {}", &self.table())
            + match &self.condition() {
                Some(v) => v,
                None => "",
            }
            + ";";

        write!(f, "{}", query)?;
        Ok(())
    }
}

impl Query {
    fn to_delete(&self) -> String {
        let query = format!("DELETE {}", &self.table())
            + match &self.condition() {
                Some(v) => v,
                None => "",
            }
            + ";";

        query
    }
    fn table(&self) -> String {
        match &self.element_type {
            Element::Book { .. } => "books".to_owned(),
            Element::ReadingLog { .. } => "reading_logs".to_owned(),
        }
    }

    // クエリの条件を" WHERE ..." の形で返す (先頭1文字スペース)
    fn condition(&self) -> Option<String> {
        let query = [
            self.user.map(|v| format!("user = {}", v)),
            self.isbn.map(|v| format!("isbn = {}", v)),
            self.title.as_ref().map(|v| format!("title = {}", v)),
            self.author.as_ref().map(|v| format!("author = {}", v)),
            self.publisher
                .as_ref()
                .map(|v| format!("publisher = {}", v)),
            self.date_from.map(|v| format!("date >= {}", v)),
            self.date_to.map(|v| format!("date <= {}", v)),
        ]
        .into_iter()
        .flatten()
        .collect::<Vec<String>>()
        .join(" AND ");

        if query.is_empty() {
            None
        } else {
            Some(" WHERE".to_string() + " " + &query)
        }
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    #[test]
    fn add_book() {
        let test = async {
            let db = Database::connect("test".to_string()).await.unwrap();
            let e = Element::Book {
                #[allow(clippy::inconsistent_digit_grouping)]
                isbn: 978_4_00_000000_0,
                title: "テスト".to_string(),
                authors: vec!["テス山ト次郎".to_string()],
                publisher: "テスト社".to_string(),
                year: 2024,
                page_count: 777,
                image_url: "https://www.example.com".to_string(),
            };
            db.add(e).await.unwrap();
            let q = Query {
                element_type: Element::empty_book(),
                user: None,
                isbn: None,
                title: None,
                author: None,
                publisher: None,
                date_from: None,
                date_to: None,
            };

            let q_str = q.to_string();
            dbg!(q_str);

            let res = &db.query(q).await.unwrap();

            dbg!(res);
        };
        tauri::async_runtime::block_on(test);
    }
}
