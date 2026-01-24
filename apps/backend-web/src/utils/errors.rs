use bookie_core::ports::DbError;
use worker::Error as WorkerError;

/// DbErrorをWorkerErrorに変換
pub fn handle_db_error(err: DbError) -> WorkerError {
    match err {
        DbError::NotFound => WorkerError::RustError("Not found".to_string()),
        DbError::UniqueConstraint(msg) => WorkerError::RustError(format!("Unique constraint: {}", msg)),
        DbError::Transaction(msg) => WorkerError::RustError(format!("Transaction error: {}", msg)),
        DbError::Query(msg) => WorkerError::RustError(format!("Query error: {}", msg)),
        DbError::Connection(msg) => WorkerError::RustError(format!("Connection error: {}", msg)),
    }
}
