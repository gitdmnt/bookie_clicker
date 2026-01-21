use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum Table {
    Book,
    ReadingLog,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
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
    pub created_at: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLog {
    pub id: Option<String>,
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
