use std::fs;
use std::path::PathBuf;
use tauri::async_runtime::Mutex;

use surrealdb::engine::local::{Db, RocksDb};
use surrealdb::{RecordId, Surreal};

pub mod query;
pub use query::Query;

pub mod table;
pub use table::{Book, ReadingLog, ReadingLogForStore, Table};

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

    pub async fn export(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let db = self.db.lock().await;
        let export_data = db.query("SELECT * FROM books");
        let export_data: Vec<Book> = export_data.await?.take(0)?;
        let json = serde_json::to_string_pretty(&export_data)?;
        let export_path = self.path.join("bookie_clicker_export.json");
        fs::write(&export_path, json)?;

        println!("Database exported to {:?}", export_path);

        Ok(export_path)
    }

    pub async fn add_book(&self, book: Book) -> Result<(), surrealdb::Error> {
        let db = self.db.lock().await;
        let _: Option<Book> = db.create("books").content(book).await?;
        Ok(())
    }

    pub async fn add_reading_log(
        &self,
        mut reading_log: ReadingLog,
    ) -> Result<(), surrealdb::Error> {
        reading_log.id = None;
        let reading_log: ReadingLogForStore = reading_log.into();
        let db = self.db.lock().await;
        let _: Option<ReadingLogForStore> = db.create("reading_logs").content(reading_log).await?;
        Ok(())
    }

    pub async fn select_books(&self, query: Query) -> Result<Vec<Book>, surrealdb::Error> {
        let query_str = query.to_string();
        let db = self.db.lock().await;
        db.query(query_str).await?.take::<Vec<Book>>(0)
    }

    pub async fn select_reading_logs(
        &self,
        query: Query,
    ) -> Result<Vec<ReadingLog>, surrealdb::Error> {
        let query_str = query.to_string();
        let db = self.db.lock().await;
        db.query(query_str)
            .await?
            .take::<Vec<ReadingLogForStore>>(0)
            .map(|v| v.into_iter().map(|r| r.into()).collect())
    }

    pub async fn delete_books(&self, query: Query) -> Result<(), surrealdb::Error> {
        let query = query.to_delete();
        let db = self.db.lock().await;
        let _ = db.query(query).await?;
        Ok(())
    }

    pub async fn delete_reading_logs(&self, query: Query) -> Result<(), surrealdb::Error> {
        let query = query.to_delete();
        let db = self.db.lock().await;
        let _ = db.query(query).await?;
        Ok(())
    }
}
