/// Sub-module defining the Book data structure for database storage.
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Book {
    isbn: u64, // Primary Key
    title: String,
    series_title: Option<String>,
    authors: Vec<String>,
    publisher: String,
    year: u32,
    page_count: u32,
    image_url: String,
}

impl Book {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        isbn: u64,
        title: String,
        series_title: Option<String>,
        authors: Vec<String>,
        publisher: String,
        year: u32,
        page_count: u32,
        image_url: String,
    ) -> Self {
        Book {
            isbn,
            title,
            series_title,
            authors,
            publisher,
            year,
            page_count,
            image_url,
        }
    }

    pub fn empty_book() -> Self {
        Book {
            isbn: 0,
            title: "".to_string(),
            series_title: None,
            authors: vec![],
            publisher: "".to_string(),
            year: 0,
            page_count: 0,
            image_url: "".to_string(),
        }
    }
}
