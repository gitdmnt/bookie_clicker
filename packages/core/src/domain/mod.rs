pub mod book;
pub mod isbn;
pub mod reading_log;
pub mod services;

pub use book::Book;
pub use isbn::{parse_isbn, Isbn};
pub use reading_log::{Lap, ReadingLog};
pub use services::reading_session::ReadingSession;

/// Database table identifier - kept for backward compatibility
#[derive(serde::Serialize, serde::Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum Table {
    Book,
    ReadingLog,
}
