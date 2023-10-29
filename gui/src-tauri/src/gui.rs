// use crate::cli::ReadFlag;
use chrono::NaiveDate;
use reqwest::get;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::plugin::Plugin;

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
    #[serde(rename = "imageUrl")]
    image_url: String,
    #[serde(rename = "totalPageCount")]
    total_page_count: u32,
}

impl BookAttr {
    fn new() -> BookAttr {
        BookAttr {
            isbn: String::new(),
            title: String::new(),
            subtitle: String::new(),
            authors: vec![],
            image_url: String::new(),
            total_page_count: 0,
        }
    }
    pub async fn from(isbn: &str) -> Result<BookAttr, String> {
        // Google Books APIにリクエスト
        let url = format!(
            "https://www.googleapis.com/books/v1/volumes?q=isbn:{}",
            isbn
        );
        let raw = match get(url).await {
            Ok(a) => a.text().await.unwrap(),
            Err(e) => return Err(e.to_string()),
        };

        // JSONデータを処理して詰め込んでいく
        let ser: Value = serde_json::from_str(&raw).unwrap();
        if ser["totalItems"].as_i64().unwrap() == 0 {
            return Err(String::from("No result"));
        }
        let item = &ser["items"][0]["volumeInfo"];
        let attr = BookAttr {
            isbn: match item["industryIdentidiers"][1]["identifier"].as_str() {
                Some(s) => s.to_owned(),
                None => isbn.to_owned(),
            },
            title: item["title"].as_str().unwrap().to_owned(),
            subtitle: match item["subtitle"].as_str() {
                Some(s) => s.to_owned(),
                None => String::new(),
            },
            authors: item["authors"]
                .as_array()
                .unwrap()
                .to_owned()
                .into_iter()
                .map(|s| s.as_str().unwrap().to_owned())
                .collect(),
            image_url: match item["imageLinks"]["smallThumbnail"].as_str() {
                Some(s) => s.to_owned(),
                None => String::new(),
            },
            total_page_count: item["pageCount"].as_i64().unwrap() as u32,
        };

        Ok(attr)
    }
    pub fn fake() -> Result<BookAttr, String> {
        Ok(BookAttr {
            isbn: String::from("20020922"),
            title: String::from("あらゆるもののすべて"),
            subtitle: String::from("4歳児編"),
            authors: vec![
                String::from("小野田マシンガン"),
                String::from("豚汁大手 大谷商社"),
            ],
            image_url: String::from(
                "https://github.com/gitdmnt/gitdmnt.github.io/blob/main/public/favicon.png",
            ),
            total_page_count: 99,
        })
    }
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
