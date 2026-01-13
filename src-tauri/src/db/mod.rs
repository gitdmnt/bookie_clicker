use std::fs;
use std::path::PathBuf;
use tauri::async_runtime::Mutex;

use surrealdb::engine::local::{Db, RocksDb};
use surrealdb::{RecordId, Surreal};

pub mod query;
pub use query::Query;

pub mod table;
pub use table::{Book, Element, ReadingLogForStore, Table};

pub struct Database {
    path: PathBuf,
    db: Mutex<Surreal<Db>>,
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
