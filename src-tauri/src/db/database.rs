use std::fs;
use std::path::PathBuf;
use tauri::async_runtime::Mutex;

use surrealdb::engine::any::Any;
use surrealdb::Surreal;

use crate::db::book::Book;
use crate::db::element::Element;
use crate::db::query::Query;
use crate::db::readinglog::ReadingLogForStore;
use crate::db::table::Table;
pub struct Database {
    path: PathBuf,
    db: Mutex<Surreal<Any>>,
}

impl Database {
    pub async fn connect(path: String) -> Result<Database, surrealdb::Error> {
        let path = dirs::data_dir().unwrap().join("bookie_clicker").join(path);

        #[cfg(not(feature = "release-storage"))]
        // Use the unit type which implements IntoEndpoint for an in-memory DB
        let endpoint = "memory".to_owned();

        #[cfg(feature = "release-storage")]
        // For RocksDB, construct a Config (which implements IntoEndpoint)
        let endpoint = format!("rocksdb://{}", path.to_str().unwrap());

        let db = surrealdb::engine::any::connect(endpoint).await?;

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
