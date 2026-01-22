use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::async_runtime::Mutex;

use async_trait::async_trait;
use bookie_core::ports::{DatabasePort, DbError, Filter, FilterValue, QueryBuilder};
use surrealdb::engine::any::Any;
use surrealdb::{RecordId, Surreal};

pub mod table;
pub use table::{Book, Lap, LapForStore, ReadingLog, ReadingLogForStore};

pub struct SurrealDatabase {
    path: PathBuf,
    db: Mutex<Surreal<Any>>,
}

// Legacy type alias for backward compatibility during migration
pub type Database = SurrealDatabase;

impl SurrealDatabase {
    pub async fn connect(path: String) -> Result<SurrealDatabase, surrealdb::Error> {
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

        Ok(SurrealDatabase { path, db })
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

    pub async fn query_raw(&self, query: String) -> Result<String, surrealdb::Error> {
        let db = self.db.lock().await;
        let res = db.query(query).await?;
        Ok(format!("{:#?}", res))
    }
}

// Helper function to convert QueryBuilder to SurrealQL WHERE clause
fn query_builder_to_where_clause(builder: &QueryBuilder) -> Option<String> {
    if builder.filters.is_empty() {
        return None;
    }

    let conditions: Vec<String> = builder
        .filters
        .iter()
        .map(|filter| match filter {
            Filter::Eq(field, value) => format!("{} = {}", field, format_filter_value(value)),
            Filter::Gte(field, value) => format!("{} >= {}", field, format_filter_value(value)),
            Filter::Lte(field, value) => format!("{} <= {}", field, format_filter_value(value)),
            Filter::Contains(field, value) => format!("{} CONTAINS '{}'", field, value),
        })
        .collect();

    Some(format!(" WHERE {}", conditions.join(" AND ")))
}

fn format_filter_value(value: &FilterValue) -> String {
    match value {
        FilterValue::String(s) => format!("'{}'", s),
        FilterValue::U64(n) => n.to_string(),
        FilterValue::U32(n) => n.to_string(),
        FilterValue::U16(n) => n.to_string(),
        FilterValue::U8(n) => n.to_string(),
    }
}

// Implement DatabasePort trait for SurrealDatabase
#[async_trait]
impl DatabasePort for SurrealDatabase {
    async fn add_book(&self, book: bookie_core::models::Book) -> Result<(), DbError> {
        let db = self.db.lock().await;
        let _: Option<Book> = db
            .create("books")
            .content(book)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?;
        Ok(())
    }

    async fn find_books(
        &self,
        query: QueryBuilder,
    ) -> Result<Vec<bookie_core::models::Book>, DbError> {
        let where_clause = query_builder_to_where_clause(&query);
        let query_str = format!(
            "SELECT * FROM books{}{}{}",
            where_clause.unwrap_or_default(),
            query
                .limit
                .map(|l| format!(" LIMIT {}", l))
                .unwrap_or_default(),
            query
                .offset
                .map(|o| format!(" START {}", o))
                .unwrap_or_default()
        );

        let db = self.db.lock().await;
        let books: Vec<Book> = db
            .query(query_str)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?
            .take::<Vec<Book>>(0)
            .map_err(|e| DbError::Query(e.to_string()))?;

        Ok(books)
    }

    async fn delete_books(&self, query: QueryBuilder) -> Result<(), DbError> {
        let where_clause = query_builder_to_where_clause(&query);
        let query_str = format!("DELETE books{}", where_clause.unwrap_or_default());

        let db = self.db.lock().await;
        db.query(query_str)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?;
        Ok(())
    }

    async fn add_reading_log(
        &self,
        mut log: bookie_core::models::ReadingLog,
    ) -> Result<String, DbError> {
        log.id = None; // always create new
        let log_store: ReadingLogForStore = log.into();

        let db = self.db.lock().await;
        let created: Option<ReadingLogForStore> = db
            .create("reading_logs")
            .content(log_store)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?;

        let record =
            created.ok_or_else(|| DbError::Query("Failed to create reading log".to_string()))?;
        let id = record
            .id
            .ok_or_else(|| DbError::Query("No ID returned".to_string()))?;

        Ok(id.to_string())
    }

    async fn find_reading_logs(
        &self,
        query: QueryBuilder,
    ) -> Result<Vec<bookie_core::models::ReadingLog>, DbError> {
        let where_clause = query_builder_to_where_clause(&query);
        let query_str = format!(
            "SELECT * FROM reading_logs{}{}{}",
            where_clause.unwrap_or_default(),
            query
                .limit
                .map(|l| format!(" LIMIT {}", l))
                .unwrap_or_default(),
            query
                .offset
                .map(|o| format!(" START {}", o))
                .unwrap_or_default()
        );

        let db = self.db.lock().await;
        let logs: Vec<ReadingLogForStore> = db
            .query(query_str)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?
            .take::<Vec<ReadingLogForStore>>(0)
            .map_err(|e| DbError::Query(e.to_string()))?;

        Ok(logs.into_iter().map(|l| l.into()).collect())
    }

    async fn delete_reading_logs(&self, query: QueryBuilder) -> Result<(), DbError> {
        let where_clause = query_builder_to_where_clause(&query);
        let query_str = format!("DELETE reading_logs{}", where_clause.unwrap_or_default());

        let db = self.db.lock().await;
        db.query(query_str)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?;
        Ok(())
    }

    async fn add_laps(
        &self,
        reading_log: bookie_core::models::ReadingLog,
        laps: Vec<bookie_core::models::Lap>,
    ) -> Result<(), DbError> {
        let db = self.db.lock().await;

        let id = match &reading_log.id {
            Some(id) => RecordId::from_str(id).map_err(|e| DbError::Query(e.to_string()))?,
            None => {
                let reading_log_store: ReadingLogForStore = reading_log.into();
                let created: Option<ReadingLogForStore> = db
                    .create("reading_logs")
                    .content(reading_log_store)
                    .await
                    .map_err(|e| DbError::Query(e.to_string()))?;
                let rl = created.ok_or_else(|| {
                    DbError::Transaction("Failed to create reading_log".to_string())
                })?;
                rl.id.ok_or_else(|| {
                    DbError::Transaction("No ID returned for reading_log".to_string())
                })?
            }
        };

        // Create laps referencing the reading_log id
        for lap in laps.into_iter() {
            let mut lap_store: LapForStore = lap.into();
            lap_store.reading_log = Some(id.clone());
            let res: Option<LapForStore> = db
                .create("laps")
                .content(lap_store)
                .await
                .map_err(|e| DbError::Transaction(e.to_string()))?;

            if res.is_none() {
                return Err(DbError::Transaction(
                    "Failed to create lap; should rollback reading_log".to_string(),
                ));
            }
        }

        Ok(())
    }

    async fn find_laps(
        &self,
        reading_log: bookie_core::models::ReadingLog,
    ) -> Result<Vec<bookie_core::models::Lap>, DbError> {
        let id = reading_log
            .id
            .ok_or_else(|| DbError::Query("Reading log has no ID".to_string()))?;
        let query = format!(
            "SELECT * from laps WHERE readingLog = type::Thing(\"{}\")",
            id
        );

        let db = self.db.lock().await;
        let laps: Vec<LapForStore> = db
            .query(query)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?
            .take::<Vec<LapForStore>>(0)
            .map_err(|e| DbError::Query(e.to_string()))?;

        Ok(laps.into_iter().map(|l| l.into()).collect())
    }

    async fn delete_lap(&self, id: String) -> Result<(), DbError> {
        let query = format!("DELETE {}", id);
        let db = self.db.lock().await;
        db.query(query)
            .await
            .map_err(|e| DbError::Query(e.to_string()))?;
        Ok(())
    }

    async fn export_all(
        &self,
    ) -> Result<
        (
            Vec<bookie_core::models::Book>,
            Vec<bookie_core::models::ReadingLog>,
        ),
        DbError,
    > {
        let db = self.db.lock().await;

        let books: Vec<Book> = db
            .query("SELECT * FROM books")
            .await
            .map_err(|e| DbError::Query(e.to_string()))?
            .take(0)
            .map_err(|e| DbError::Query(e.to_string()))?;

        let logs: Vec<ReadingLogForStore> = db
            .query("SELECT * FROM reading_logs")
            .await
            .map_err(|e| DbError::Query(e.to_string()))?
            .take(0)
            .map_err(|e| DbError::Query(e.to_string()))?;

        Ok((books, logs.into_iter().map(|l| l.into()).collect()))
    }
}
