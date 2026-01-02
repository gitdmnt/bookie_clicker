/// Sub-module defining the ReadingLog data structure for database storage.
use serde::{Deserialize, Serialize};
use surrealdb::RecordId;

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

impl ReadingLog {
    pub fn new(
        id: Option<String>,
        isbn: u64,
        time: [String; 2],
        page: [u16; 2],
        note: String,
        rating: Option<u8>,
    ) -> Self {
        ReadingLog {
            id,
            isbn,
            time,
            page,
            note,
            rating,
        }
    }

    pub fn empty_reading_log() -> Self {
        ReadingLog {
            id: None,
            isbn: 0,
            time: ["".to_owned(), "".to_owned()],
            page: [0, 0],
            note: "".to_string(),
            rating: None,
        }
    }
}
