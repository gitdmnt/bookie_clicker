use crate::db::RecordId;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub enum Table {
    Book,
    ReadingLog,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Element {
    pub element_type: Table,
    // #[serde(flatten)] <- Internally tagged として認識される
    pub book: Option<Book>,
    // #[serde(flatten)]
    pub reading_log: Option<ReadingLog>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Book {
    pub isbn: u64, // Primary Key
    pub title: String,
    pub series_title: Option<String>,
    pub authors: Vec<String>,
    pub publisher: String,
    pub year: u32,
    pub page_count: u32,
    pub image_url: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLog {
    pub id: Option<String>,
    pub isbn: u64,
    pub time: [String; 2],
    pub page: [u16; 2],
    pub note: String,
    pub rating: Option<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLogForStore {
    pub id: Option<RecordId>,
    pub isbn: u64,
    pub time: [String; 2],
    pub page: [u16; 2],
    pub note: String,
    pub rating: Option<u8>,
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
        let book = Book {
            isbn: 0,
            title: "".to_string(),
            series_title: None,
            authors: vec![],
            publisher: "".to_string(),
            year: 0,
            page_count: 0,
            image_url: "".to_string(),
        };
        Element {
            element_type: Table::Book,
            book: Some(book),
            reading_log: None,
        }
    }
    fn empty_reading_log() -> Element {
        let reading_log = ReadingLog {
            id: None,
            isbn: 0,
            time: ["".to_owned(), "".to_owned()],
            page: [0, 0],
            note: "".to_string(),
            rating: None,
        };
        Element {
            element_type: Table::ReadingLog,
            book: None,
            reading_log: Some(reading_log),
        }
    }
}

impl From<ReadingLogForStore> for ReadingLog {
    fn from(reading_log: ReadingLogForStore) -> ReadingLog {
        ReadingLog {
            id: reading_log.id.map(|key| key.to_string()),
            isbn: reading_log.isbn,
            time: reading_log.time,
            page: reading_log.page,
            note: reading_log.note,
            rating: reading_log.rating,
        }
    }
}

impl From<ReadingLog> for ReadingLogForStore {
    fn from(reading_log: ReadingLog) -> ReadingLogForStore {
        //id validation
        let id = reading_log.id.as_ref().and_then(|id| {
            let parts: Vec<&str> = id.split(':').collect();
            (parts.len() == 2 && parts[0] == "reading_logs")
                .then(|| RecordId::from_table_key(parts[0], parts[1]))
        });

        ReadingLogForStore {
            id,
            isbn: reading_log.isbn,
            time: reading_log.time,
            page: reading_log.page,
            note: reading_log.note,
            rating: reading_log.rating,
        }
    }
}
