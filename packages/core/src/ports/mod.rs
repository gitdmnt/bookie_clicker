use crate::models::{Book, Lap, ReadingLog};
use async_trait::async_trait;

#[cfg(test)]
mod tests;

#[async_trait]
pub trait HttpClient: Send + Sync {
    async fn get_text(&self, url: &str) -> Result<String, String>;
}

pub trait Clock: Send + Sync {
    fn now_rfc3339(&self) -> String;
}

// Database abstraction layer
#[derive(Debug, Clone, PartialEq)]
pub enum DbError {
    NotFound,
    UniqueConstraint(String),
    Transaction(String),
    Query(String),
    Connection(String),
}

impl std::fmt::Display for DbError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DbError::NotFound => write!(f, "Record not found"),
            DbError::UniqueConstraint(msg) => write!(f, "Unique constraint violation: {}", msg),
            DbError::Transaction(msg) => write!(f, "Transaction error: {}", msg),
            DbError::Query(msg) => write!(f, "Query error: {}", msg),
            DbError::Connection(msg) => write!(f, "Connection error: {}", msg),
        }
    }
}

impl std::error::Error for DbError {}

#[derive(Debug, Clone, PartialEq)]
pub enum FilterValue {
    String(String),
    U64(u64),
    U32(u32),
    U16(u16),
    U8(u8),
}

#[derive(Debug, Clone, PartialEq)]
pub enum Filter {
    Eq(String, FilterValue),
    Gte(String, FilterValue),
    Lte(String, FilterValue),
    Contains(String, String),
}

#[derive(Debug, Clone, PartialEq)]
pub struct QueryBuilder {
    pub filters: Vec<Filter>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

impl QueryBuilder {
    pub fn new() -> Self {
        Self {
            filters: Vec::new(),
            limit: None,
            offset: None,
        }
    }

    pub fn filter(mut self, filter: Filter) -> Self {
        self.filters.push(filter);
        self
    }

    pub fn limit(mut self, limit: u32) -> Self {
        self.limit = Some(limit);
        self
    }

    pub fn offset(mut self, offset: u32) -> Self {
        self.offset = Some(offset);
        self
    }
}

impl Default for QueryBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
pub trait DatabasePort: Send + Sync {
    // Book operations
    async fn add_book(&self, book: Book) -> Result<(), DbError>;
    async fn find_books(&self, query: QueryBuilder) -> Result<Vec<Book>, DbError>;
    async fn delete_books(&self, query: QueryBuilder) -> Result<(), DbError>;

    // ReadingLog operations
    async fn add_reading_log(&self, log: ReadingLog) -> Result<String, DbError>; // Returns generated ID
    async fn find_reading_logs(&self, query: QueryBuilder) -> Result<Vec<ReadingLog>, DbError>;
    async fn delete_reading_logs(&self, query: QueryBuilder) -> Result<(), DbError>;

    // Lap operations
    async fn add_laps(&self, reading_log: ReadingLog, laps: Vec<Lap>) -> Result<(), DbError>;
    async fn find_laps(&self, reading_log: ReadingLog) -> Result<Vec<Lap>, DbError>;
    async fn delete_lap(&self, id: String) -> Result<(), DbError>;

    // Utility operations
    async fn export_all(&self) -> Result<(Vec<Book>, Vec<ReadingLog>), DbError>;
}
