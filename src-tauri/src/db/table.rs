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
    pub created_at: String,
    pub session_duration_sec: u64,
    pub page: [u16; 2],
    pub rating: Option<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLogForStore {
    pub id: Option<RecordId>,
    pub isbn: u64,
    pub created_at: String,
    pub session_duration_sec: u64,
    pub page: [u16; 2],
    pub rating: Option<u8>,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Lap {
    pub id: Option<String>,
    pub elapsed_ms: u64,
    pub note: Option<String>,
    pub ref_page: Option<u32>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LapForStore {
    pub id: Option<RecordId>,
    pub reading_log: Option<RecordId>,
    pub elapsed_ms: u64,
    pub note: Option<String>,
    pub ref_page: Option<u32>,
    pub created_at: String,
}

impl From<ReadingLogForStore> for ReadingLog {
    fn from(reading_log: ReadingLogForStore) -> ReadingLog {
        ReadingLog {
            id: reading_log.id.map(|key| key.to_string()),
            isbn: reading_log.isbn,
            created_at: reading_log.created_at,
            session_duration_sec: reading_log.session_duration_sec,
            page: reading_log.page,
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
            created_at: reading_log.created_at,
            session_duration_sec: reading_log.session_duration_sec,
            page: reading_log.page,
            rating: reading_log.rating,
        }
    }
}

impl From<LapForStore> for Lap {
    fn from(lap: LapForStore) -> Lap {
        Lap {
            id: lap.id.map(|key| key.to_string()),
            elapsed_ms: lap.elapsed_ms,
            note: lap.note,
            ref_page: lap.ref_page,
            created_at: lap.created_at,
        }
    }
}

impl From<Lap> for LapForStore {
    fn from(lap: Lap) -> LapForStore {
        let id = lap.id.as_ref().and_then(|id| {
            let parts: Vec<&str> = id.split(':').collect();
            (parts.len() == 2 && parts[0] == "laps")
                .then(|| RecordId::from_table_key(parts[0], parts[1]))
        });

        LapForStore {
            id,
            reading_log: None,
            elapsed_ms: lap.elapsed_ms,
            note: lap.note,
            ref_page: lap.ref_page,
            created_at: lap.created_at,
        }
    }
}
