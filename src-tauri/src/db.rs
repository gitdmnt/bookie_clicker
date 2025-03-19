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

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub enum Table {
    Book,
    ReadingLog,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Element {
    element_type: Table,
    // #[serde(flatten)] <- Internally tagged として認識される
    book: Option<Book>,
    // #[serde(flatten)]
    reading_log: Option<ReadingLog>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Book {
    isbn: u64, // Primary Key
    title: String,
    authors: Vec<String>,
    publisher: String,
    year: u32,
    page_count: u32,
    image_url: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLog {
    user: u64,
    isbn: u64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Query {
    // メタデータ
    element_type: Table,
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

        db.query("DEFINE INDEX unique_isbn ON books FIELDS isbn UNIQUE;")
            .await?;

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
        let table = match e.element_type {
            Table::Book => "books",
            Table::ReadingLog => "reading_logs",
        };

        match e.element_type {
            Table::Book => {
                let book = e.book.unwrap();
                let _: Option<Book> = db.create(table).content(book).await?;
            }
            Table::ReadingLog => {
                let reading_log = e.reading_log.unwrap();
                let _: Option<ReadingLog> = db.create(table).content(reading_log).await?;
            }
        };
        Ok(())
    }

    pub async fn select(&self, query: Query) -> Result<Vec<Element>, surrealdb::Error> {
        let query_str = query.to_string();
        let db = self.db.lock().await;

        match query.element_type {
            Table::Book => db.query(query_str).await?.take::<Vec<Book>>(0).map(|v| {
                v.into_iter()
                    .map(|book| Element {
                        element_type: Table::Book,
                        book: Some(book),
                        reading_log: None,
                    })
                    .collect()
            }),
            Table::ReadingLog => db
                .query(query_str)
                .await?
                .take::<Vec<ReadingLog>>(0)
                .map(|v| {
                    v.into_iter()
                        .map(|reading_log| Element {
                            element_type: Table::ReadingLog,
                            book: None,
                            reading_log: Some(reading_log),
                        })
                        .collect()
                }),
        }
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
        let book = Book {
            isbn: 0,
            title: "".to_string(),
            authors: vec![],
            publisher: "".to_string(),
            year: 0,
            page_count: 0,
            image_url: "".to_string(),
        };
        Element {
            element_type: Table::Book,
            book: Some(book),
            reading_log: None,
        }
    }
    fn empty_reading_log() -> Element {
        let reading_log = ReadingLog { user: 0, isbn: 0 };
        Element {
            element_type: Table::ReadingLog,
            book: None,
            reading_log: Some(reading_log),
        }
    }
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
        format!("DELETE {}", &self.table())
            + match &self.condition() {
                Some(v) => v,
                None => "",
            }
            + ";"
    }
    fn table(&self) -> String {
        match &self.element_type {
            Table::Book { .. } => "books".to_owned(),
            Table::ReadingLog { .. } => "reading_logs".to_owned(),
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
    fn for_all() -> Query {
        Query {
            element_type: Table::Book,
            user: None,
            date_from: None,
            date_to: None,
            isbn: None,
            title: None,
            author: None,
            publisher: None,
        }
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    #[test]
    fn serde_element_book() {
        let book = Book {
            isbn: 1,
            title: "t".to_string(),
            authors: vec!["a".to_string()],
            publisher: "p".to_string(),
            year: 2,
            page_count: 3,
            image_url: "i".to_string(),
        };
        let element = Element {
            element_type: Table::Book,
            book: Some(book),
            reading_log: None,
        };
        let json = r#"
        {
            "elementType": "book",
            "book": {
                "isbn": 1,
                "title": "t",
                "authors": ["a"],
                "publisher": "p",
                "year": 2,
                "pageCount": 3,
                "imageUrl": "i"
            }
        }
        "#;
        let deserialized: Element = serde_json::from_str(json).unwrap();
        assert_eq!(element, deserialized);
    }

    #[test]
    fn tauri_add_book() {
        let task = async {
            let db = Database::connect("test".to_string()).await.unwrap();
            let query = Query::for_all();
            let _ = db.delete(query).await.unwrap();

            let book = Book {
                isbn: 1,
                title: "t".to_string(),
                authors: vec!["a".to_string()],
                publisher: "p".to_string(),
                year: 2,
                page_count: 3,
                image_url: "i".to_string(),
            };
            let element = Element {
                element_type: Table::Book,
                book: Some(book),
                reading_log: None,
            };

            db.add(element).await.unwrap();
            let query = Query {
                element_type: Table::Book,
                user: None,
                date_from: None,
                date_to: None,
                isbn: Some(1),
                title: None,
                author: None,
                publisher: None,
            };
            let result = db.select(query).await.unwrap();
            let book = Book {
                isbn: 1,
                title: "t".to_string(),
                authors: vec!["a".to_string()],
                publisher: "p".to_string(),
                year: 2,
                page_count: 3,
                image_url: "i".to_string(),
            };
            let element = Element {
                element_type: Table::Book,
                book: Some(book),
                reading_log: None,
            };
            assert_eq!(result[0], element);
        };
        tauri::async_runtime::block_on(task);
    }
}
