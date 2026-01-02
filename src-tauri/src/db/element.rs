use crate::db::book::Book;
use crate::db::readinglog::ReadingLog;
use crate::db::table::Table;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Element {
    pub element_type: Table,
    // #[serde(flatten)] <- Internally tagged として認識される
    pub book: Option<Book>,
    // #[serde(flatten)]
    pub reading_log: Option<ReadingLog>,
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
        let book = Book::empty_book();
        Element {
            element_type: Table::Book,
            book: Some(book),
            reading_log: None,
        }
    }
    fn empty_reading_log() -> Element {
        let reading_log = ReadingLog::empty_reading_log();
        Element {
            element_type: Table::ReadingLog,
            book: None,
            reading_log: Some(reading_log),
        }
    }
}
