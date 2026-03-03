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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn handle_not_found() {
        let err = handle_db_error(DbError::NotFound);
        assert_eq!(err.to_string(), "Not found");
    }

    #[test]
    fn handle_unique_constraint() {
        let err = handle_db_error(DbError::UniqueConstraint("duplicate key".to_string()));
        assert_eq!(err.to_string(), "Unique constraint: duplicate key");
    }

    #[test]
    fn handle_transaction_error() {
        let err = handle_db_error(DbError::Transaction("rollback".to_string()));
        assert_eq!(err.to_string(), "Transaction error: rollback");
    }

    #[test]
    fn handle_query_error() {
        let err = handle_db_error(DbError::Query("syntax error".to_string()));
        assert_eq!(err.to_string(), "Query error: syntax error");
    }

    #[test]
    fn handle_connection_error() {
        let err = handle_db_error(DbError::Connection("timeout".to_string()));
        assert_eq!(err.to_string(), "Connection error: timeout");
    }
}
