// 次にやること
//

use core::fmt;
use std::fmt::Display;

use reqwest;
use serde_json::Value;

#[derive(Default)]
pub struct BookAttribute {
    title: String,
    authors: Vec<String>,
    pub isbn: String,
    page: u32,
    image_url: String,
}

impl Display for BookAttribute {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "title: {}, authors: {:?}, isbn: {}, pageCount: {}, imageURL: {}",
            self.title, self.authors, self.isbn, self.page, self.image_url
        )
    }
}

impl BookAttribute {
    pub async fn search(&self) -> Result<BookAttribute, SearchError> {
        let mut attribute = Ok(BookAttribute::default());
        if self.isbn != "" {
            attribute = self.search_book_from_isbn().await;
        }
        // todo タイトル検索とか
        attribute
    }
    async fn search_book_from_isbn(&self) -> Result<BookAttribute, SearchError> {
        // google books API を使いたいんですけど！
        let url = format!(
            "https://www.googleapis.com/books/v1/volumes?q=isbn:{}",
            &self.isbn
        );
        let attribute = fetch_attribute_from_url(url).await;
        attribute
    }
}

async fn fetch_attribute_from_url(url: String) -> Result<BookAttribute, SearchError> {
    let attribute_json = reqwest::get(url).await;
    let attribute = match attribute_json {
        Ok(json) => Ok(parse_json_to_attribute(json).await),
        Err(e) => {
            println!("{}", e);
            Err(SearchError {
                e: "something went wrong".to_owned(),
            })
        }
    };
    attribute
}

async fn parse_json_to_attribute(json: reqwest::Response) -> BookAttribute {
    let str = json.text().await.unwrap();
    let vec: Value = serde_json::from_str(&str).unwrap();
    let attribute = &vec["items"][0]["volumeInfo"];
    let title = attribute["title"].as_str().unwrap().to_owned();
    let authors = attribute["authors"]
        .as_array()
        .unwrap()
        .to_owned()
        .into_iter()
        .map(|s| s.as_str().unwrap().to_owned())
        .collect();
    let isbn = attribute["industryIdentifiers"][1]["identifier"]
        .as_str()
        .unwrap()
        .to_owned();
    let page = attribute["pageCount"].as_i64().unwrap() as u32;
    let image_url = attribute["imageLinks"]["smallThumbnail"]
        .as_str()
        .unwrap()
        .to_owned();
    let attribute = BookAttribute {
        title,
        authors,
        isbn,
        page,
        image_url,
    };
    println!("{}", attribute);
    attribute
}

#[derive(Debug, Clone)]
pub struct SearchError {
    e: String,
}

impl fmt::Display for SearchError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.e)
    }
}

impl std::error::Error for SearchError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        None
    }
}
