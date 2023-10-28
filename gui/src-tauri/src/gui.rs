// use crate::cli::ReadFlag;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Books {
    items: Record,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Record {
    attr: BookAttr,
    read_status: ReadStatus,
    combined_flag: ReadFlag,
    progresses: Vec<Progress>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BookAttr {
    isbn: String,
    title: String,
    subtitle: String,
    authors: Vec<String>,
    total_page_count: u32,
}

#[derive(Debug, Deserialize, Serialize)]
enum ReadStatus {
    Read,
    Reading,
    Unread,
}

#[derive(Debug, Deserialize, Serialize)]
struct Progress {
    date_start: NaiveDate,
    date_end: NaiveDate,
    flag: ReadFlag,
    memo: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct ReadFlag {
    str: String,
}
