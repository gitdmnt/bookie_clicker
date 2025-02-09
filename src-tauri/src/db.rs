use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use surrealdb::engine::local::{Db, RocksDb};
use surrealdb::Surreal;

pub struct Database {
    path: String,
    db: Surreal<Db>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "content")]
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
    Record {
        user: u64,
        isbn: u64,
    },
}

#[derive(Serialize, Deserialize)]
pub struct Query {
    // メタデータ
    element_type: Element,
    user: Option<u64>,
    date_from: Option<u32>,
    date_to: Option<u32>,

    // Book の場合
    isbn: Option<u64>, // Primary Key
    title: Option<String>,
    author: Option<String>,
    publisher: Option<String>,
    // Record の場合
}

impl Database {
    pub async fn connect(path: String) -> Result<Database, surrealdb::Error> {
        let db = Surreal::new::<RocksDb>(&path).await?;

        // 名前空間・データベースの指定
        db.use_ns("bookie_clicker").use_db("bookie_clicker").await?;

        Ok(Database { path, db })
    }

    pub async fn export(&self) -> Result<(), Box<dyn std::error::Error>> {
        let export_data: Vec<Element> = self.db.query("SELECT * FROM books").await?.take(0)?;
        let json = serde_json::to_string_pretty(&export_data)?;
        let path = PathBuf::from(&self.path).join("lib.json");
        fs::write(path, json)?;

        println!("Database exported to bookie_clicker_export.json");

        Ok(())
    }

    pub async fn add(&self, e: Element) -> Result<(), surrealdb::Error> {
        let table = match e {
            Element::Book { .. } => "books",
            Element::Record { .. } => "records",
        };
        let _: Option<Element> = self.db.create(table).content(e).await?;

        Ok(())
    }

    pub async fn query(&self, query: Query) -> Result<Vec<Element>, surrealdb::Error> {
        let query = query.to_string();
        self.db.query(query).await?.take::<Vec<Element>>(0)
    }
}

impl Element {
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
    fn empty_record() -> Element {
        Element::Record { user: 0, isbn: 0 }
    }
}

impl std::fmt::Display for Query {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let table = match &self.element_type {
            Element::Book { .. } => "books",
            Element::Record { .. } => "records",
        };
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
        let query = format!("SELECT * FROM {}", table)
            + if query.is_empty() { "" } else { " WHERE " }
            + &query
            + ";";

        write!(f, "{}", query)?;
        Ok(())
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
