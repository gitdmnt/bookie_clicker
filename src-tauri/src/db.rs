use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::async_runtime::Mutex;

use serde::{Deserialize, Serialize};
use surrealdb::engine::local::{Db, RocksDb};
use surrealdb::{RecordId, Surreal};

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
    series_title: Option<String>,
    authors: Vec<String>,
    publisher: String,
    year: u32,
    page_count: u32,
    image_url: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLog {
    id: Option<String>,
    isbn: u64,
    time: [String; 2],
    page: [u16; 2],
    note: String,
    rating: Option<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLogForStore {
    id: Option<RecordId>,
    isbn: u64,
    time: [String; 2],
    page: [u16; 2],
    note: String,
    rating: Option<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Query {
    // メタデータ
    element_type: Table,
    user: Option<u64>,

    // Book の場合
    isbn: Option<u64>, // Primary Key
    title: Option<String>,
    series_title: Option<String>,
    author: Option<String>,
    publisher: Option<String>,

    // ReadingLog の場合
    id: Option<String>,
    date_from: Option<u32>,
    date_to: Option<u32>,
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
                let mut reading_log = e.reading_log.unwrap();
                reading_log.id = None;
                let reading_log: ReadingLogForStore = reading_log.into();
                let _: Option<ReadingLogForStore> = db.create(table).content(reading_log).await?;
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
                .take::<Vec<ReadingLogForStore>>(0)
                .map(|v| {
                    v.into_iter()
                        .map(|reading_log| Element {
                            element_type: Table::ReadingLog,
                            book: None,
                            reading_log: Some(reading_log.into()),
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
            series_title: None,
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
        let reading_log = ReadingLog {
            id: None,
            isbn: 0,
            time: ["".to_owned(), "".to_owned()],
            page: [0, 0],
            note: "".to_string(),
            rating: None,
        };
        Element {
            element_type: Table::ReadingLog,
            book: None,
            reading_log: Some(reading_log),
        }
    }
}

impl From<ReadingLogForStore> for ReadingLog {
    fn from(reading_log: ReadingLogForStore) -> ReadingLog {
        ReadingLog {
            id: reading_log.id.map(|key| key.to_string()),
            isbn: reading_log.isbn,
            time: reading_log.time,
            page: reading_log.page,
            note: reading_log.note,
            rating: reading_log.rating,
        }
    }
}

impl From<ReadingLog> for ReadingLogForStore {
    fn from(reading_log: ReadingLog) -> ReadingLogForStore {
        //id validation
        let id = reading_log.id.as_ref().and_then(|id| {
            let parts: Vec<&str> = id.split(':').collect();
            (parts.len() == 2 && parts[0] == "reading_logs")
                .then(|| RecordId::from_table_key(parts[0], parts[1]))
        });

        ReadingLogForStore {
            id,
            isbn: reading_log.isbn,
            time: reading_log.time,
            page: reading_log.page,
            note: reading_log.note,
            rating: reading_log.rating,
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
            self.series_title
                .as_ref()
                .map(|v| format!("series_title = {}", v)),
            self.author.as_ref().map(|v| format!("author = {}", v)),
            self.publisher
                .as_ref()
                .map(|v| format!("publisher = {}", v)),
            self.date_from.map(|v| format!("date >= {}", v)),
            self.date_to.map(|v| format!("date <= {}", v)),
            self.id.as_ref().map(|v| format!("id = {}", v)),
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
    fn for_all_books() -> Query {
        Query {
            element_type: Table::Book,
            user: None,
            date_from: None,
            date_to: None,
            isbn: None,
            title: None,
            series_title: None,
            author: None,
            publisher: None,
            id: None,
        }
    }
    fn for_all_logs() -> Query {
        Query {
            element_type: Table::ReadingLog,
            ..Query::for_all_books()
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
            series_title: None,
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
                "seriesTitle": null,
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
            let query = Query::for_all_books();
            let _ = db.delete(query).await.unwrap();

            let book = Book {
                isbn: 1,
                title: "t".to_string(),
                series_title: None,
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
                series_title: None,
                author: None,
                publisher: None,
                id: None,
            };
            let result = db.select(query).await.unwrap();
            let book = Book {
                isbn: 1,
                title: "t".to_string(),
                series_title: None,
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

    #[test]
    fn delete_log() {
        let log1 = ReadingLog {
            id: None,
            isbn: 1,
            time: ["2021-01-01".to_string(), "2021-01-02".to_string()],
            page: [1, 2],
            note: "note".to_string(),
            rating: Some(3),
        };
        let log2 = ReadingLog {
            id: None,
            isbn: 2,
            time: ["2021-01-01".to_string(), "2021-01-02".to_string()],
            page: [1, 2],
            note: "note".to_string(),
            rating: Some(3),
        };
        let task = async {
            let db = Database::connect("test".to_string()).await.unwrap();
            db.delete(Query::for_all_books()).await.unwrap();
            db.delete(Query::for_all_logs()).await.unwrap();

            db.add(Element {
                element_type: Table::ReadingLog,
                book: None,
                reading_log: Some(log1),
            })
            .await
            .unwrap();
            db.add(Element {
                element_type: Table::ReadingLog,
                book: None,
                reading_log: Some(log2),
            })
            .await
            .unwrap();
            let query = Query::for_all_logs();
            let result = db.select(query).await.unwrap();
            assert_eq!(result.len(), 2);

            let id1 = result[0].reading_log.as_ref().unwrap().id.clone();
            let query = Query {
                id: id1,
                ..Query::for_all_logs()
            };

            db.delete(query).await.unwrap();
            let query = Query::for_all_logs();
            let result = db.select(query).await.unwrap();
            assert_eq!(result.len(), 1);

            db.delete(Query::for_all_logs()).await.unwrap();
        };
        tauri::async_runtime::block_on(task);
    }
}
