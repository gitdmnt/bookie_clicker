use proconio::input;
use reqwest::get;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::File;
use std::io::Write;

#[derive(Debug, Deserialize, Serialize)]
struct BookLib {
    items: Vec<BookAttr>,
}

impl BookLib {
    fn new() -> BookLib {
        BookLib { items: vec![] }
    }
    fn merge(&mut self, v: BookLib) {
        self.items.extend(v.items);
    }
    fn push(&mut self, v: BookAttr) {
        self.items.push(v);
    }
}

#[derive(Debug, Deserialize, Serialize)]
struct BookAttr {
    title: String,
    isbn: String,
    author: String,
    page: u32,
}

#[derive(Debug)]
struct Error;

#[tokio::main]
async fn main() -> Result<(), Error> {
    loop {
        println!("input mode");
        input! {mode: String}
        match &*mode {
            "cli" => main_cli().await?,
            s => println!("There are no mode {}", s),
        }
    }
}

async fn main_cli() -> Result<(), Error> {
    // データ入力
    let mut buf = BookLib::new();
    loop {
        println!("input isbn");
        input! {
            isbn: String,
        }
        if isbn == "q" {
            break;
        }
        // 検索
        // let book_details = fetch_book_attr(isbn).await?;
        // テストはAPIを使いたくない
        let book_details = BookAttr {
            title: "dummy_book".to_owned(),
            isbn,
            author: "udachaaaaan".to_owned(),
            page: 2,
        };
        buf.push(book_details);
    }
    let result = write_to_file(buf).await;
    Ok(())
}

async fn fetch_book_attr(isbn: String) -> Result<BookAttr, Error> {
    let url = format!(
        "https://www.googleapis.com/books/v1/volumes?q=isbn:{}",
        isbn
    );
    let attr = get(url).await;
    let attr = match attr {
        Ok(json) => parse_json_to_attribute(json).await,
        Err(e) => {
            println!("{}", e);
            Err(Error)
        }
    };
    attr
}

async fn parse_json_to_attribute(json: reqwest::Response) -> Result<BookAttr, Error> {
    let str = json.text().await.unwrap();
    let vec: Value = serde_json::from_str(&str).unwrap();
    let total_item_count = vec["totalItems"].as_i64().unwrap();
    if total_item_count == 0 {
        return Err(Error);
    }
    let attr = &vec["items"][0]["volumeInfo"];
    let title = attr["title"].as_str().unwrap().to_owned();
    let authors: Vec<String> = attr["authors"]
        .as_array()
        .unwrap()
        .to_owned()
        .into_iter()
        .map(|s| s.as_str().unwrap().to_owned())
        .collect();
    let author = (&authors[0]).to_owned();
    let isbn = attr["industryIdentifiers"][1]["identifier"]
        .as_str()
        .unwrap()
        .to_owned();
    let page = attr["pageCount"].as_i64().unwrap() as u32;
    let image_url = attr["imageLinks"]["smallThumbnail"]
        .as_str()
        .unwrap()
        .to_owned();
    let attr = BookAttr {
        title,
        author,
        isbn,
        page,
    };
    Ok(attr)
}

async fn write_to_file(buf: BookLib) -> Result<(), std::io::Error> {
    const PATH: &str = "shelf.json";
    println!("data writing");
    let mut file = match File::open(PATH) {
        Ok(file) => file,
        Err(_) => File::create(PATH)?,
    };
    let written = std::fs::read_to_string(PATH)?;
    let mut written: BookLib = serde_json::from_str(&written)?;
    written.merge(buf);
    let json = serde_json::to_string(&written)?;
    write!(file, "{}", json)?;
    file.flush()?;
    println!("finished");
    Ok(())
}
