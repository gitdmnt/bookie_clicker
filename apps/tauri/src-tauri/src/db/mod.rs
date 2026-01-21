use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::async_runtime::Mutex;

use surrealdb::engine::any::Any;
use surrealdb::{RecordId, Surreal};

pub mod query;
pub use query::Query;

pub mod table;
pub use table::{Book, Lap, LapForStore, ReadingLog, ReadingLogForStore};

pub struct Database {
    path: PathBuf,
    db: Mutex<Surreal<Any>>,
}

impl Database {
    pub async fn connect(path: String) -> Result<Database, surrealdb::Error> {
        let path = dirs::data_dir().unwrap().join(path);

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
        reading_log.id = None; // always create new
        let reading_log: ReadingLogForStore = reading_log.into();
        let db = self.db.lock().await;
        let _: Option<ReadingLogForStore> = db.create("reading_logs").content(reading_log).await?;
        Ok(())
    }

    pub async fn add_laps(
        &self,

        reading_log: ReadingLog,
        laps: Vec<Lap>,
    ) -> Result<(), surrealdb::Error> {
        let db = self.db.lock().await;

        let id = match &reading_log.id {
            Some(id) => RecordId::from_str(id)?,
            None => {
                let reading_log_store: ReadingLogForStore = reading_log.into();
                let created: Option<ReadingLogForStore> =
                    db.create("reading_logs").content(reading_log_store).await?;
                let rl = created.expect("failed to create reading_log");
                rl.id.unwrap()
            }
        };

        // create laps referencing the reading_log id
        for lap in laps.into_iter() {
            let mut lap_store: LapForStore = lap.into();
            lap_store.reading_log = Some(id.clone());
            let res: Option<LapForStore> = db.create("laps").content(lap_store).await?;
            if res.is_none() {
                panic!("failed to create lap; rolled back reading_log");
            }
        }

        Ok(())
    }

    pub async fn select_books(&self, query: Query) -> Result<Vec<Book>, surrealdb::Error> {
        let query_str = query.to_string();
        // println!("select_books query: {}", query_str);
        let db = self.db.lock().await;
        let res = db.query(query_str).await?.take::<Vec<Book>>(0);
        // println!("select_books result: {:?}", res);
        res
    }

    pub async fn select_reading_logs(
        &self,
        query: Query,
    ) -> Result<Vec<ReadingLog>, surrealdb::Error> {
        let query_str = query.to_string();
        println!("select_reading_logs query: {}", query_str);
        let db = self.db.lock().await;
        let res = db
            .query(query_str)
            .await?
            .take::<Vec<ReadingLogForStore>>(0)
            .map(|v| v.into_iter().map(|r| r.into()).collect());
        println!("select_reading_logs result: {:?}", res);
        res
    }

    pub async fn select_laps(&self, reading_log: ReadingLog) -> Result<Vec<Lap>, surrealdb::Error> {
        let query = format!(
            "SELECT * from laps WHERE readingLog = type::Thing(\"{}\")",
            reading_log.id.as_ref().unwrap()
        );
        println!("select_laps query: {}", query);
        let db = self.db.lock().await;
        db.query(query)
            .await?
            .take::<Vec<LapForStore>>(0)
            .map(|v| v.into_iter().map(|l| l.into()).collect())
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

    pub async fn delete_lap(&self, id: String) -> Result<(), surrealdb::Error> {
        let query = format!("DELETE {}", id);
        let db = self.db.lock().await;
        let _ = db.query(query).await?;
        Ok(())
    }

    pub async fn query_raw(&self, query: String) -> Result<String, surrealdb::Error> {
        let db = self.db.lock().await;
        let res = db.query(query).await?;
        Ok(format!("{:#?}", res))
    }
}
