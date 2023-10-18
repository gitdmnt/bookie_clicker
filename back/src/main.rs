use chrono::{self, Local, NaiveDate};
use reqwest::get;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::File;
use std::io::{self, Write};
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<(), Error> {
    main_cli().await
}

// 1書庫の単位
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

// 1冊の本に対する各属性
#[derive(Debug, Deserialize, Serialize)]
struct BookAttr {
    title: String,
    isbn: String,
    author: String,
    pages: Pages,
    read_status: ReadStatus,
    date: Date,
}

impl BookAttr {
    fn new() -> BookAttr {
        BookAttr {
            title: String::new(),
            isbn: String::new(),
            author: String::new(),
            pages: Pages::new(0),
            read_status: ReadStatus::Unread,
            date: Date::new(),
        }
    }
}

// 本の状態 読了/進行中/未読
#[derive(Debug, Deserialize, Serialize, PartialEq)]
enum ReadStatus {
    Read,
    Reading,
    Unread,
}

/// ページ数に関する情報
/// maxは本のページ数。
/// numは現在読んだページ数の合計。
/// read_flagsはページごとの読み終わったか否かのフラグを16進文字列にして格納したもの。ページ数が16の倍数でない場合は末尾に0を足して埋めている。
#[derive(Debug, Deserialize, Serialize)]
struct Pages {
    max: u32,
    num: u32,
    read_flags: String,
}

impl Pages {
    // 初期化のために最大ページ数を入力させている。
    fn new(max: u32) -> Pages {
        let flag_size = max / 4 + 1;
        let mut read_flags = String::new();
        for _i in 0..flag_size {
            read_flags += "0";
        }
        Pages {
            max,
            num: 0,
            read_flags,
        }
    }
    // フラグ管理
    fn set(&mut self, start: u32, end: u32) {
        let mut read_flags = vec![];
        // 16進文字列伸長
        for i in 0..self.read_flags.len() {
            let c = &self.read_flags[i..i + 1];
            let n = u8::from_str_radix(c, 16).unwrap();
            let bin_4bit = format!("{:04b}", n);
            for c in bin_4bit.chars() {
                if c == '0' {
                    read_flags.push(false);
                } else {
                    read_flags.push(true);
                }
            }
        }

        // フラグを編集して読んだページ数を加算
        if start > 0 {
            for i in start..=end {
                let i = i as usize - 1;
                if !read_flags[i] {
                    read_flags[i] = true;
                    self.num += 1;
                }
            }
        }

        // 16進文字列に圧縮
        let mut read_flags_str = String::new();
        let mut bit: u16 = 0b0;
        for i in 0..read_flags.len() {
            bit <<= 1;
            bit += if read_flags[i] { 1 } else { 0 };
            if i % 16 == 15 {
                read_flags_str += &format!("{:04x}", bit);
                bit = 0b0;
            }
        }
        self.read_flags = read_flags_str;
    }
}

#[derive(Debug, Deserialize, Serialize)]
struct Date {
    date_start: NaiveDate,
    date_end: NaiveDate,
}

impl Date {
    fn new() -> Date {
        let d = "2002-09-22".parse::<NaiveDate>().unwrap(); // my birthday! woo
        Date {
            date_start: d,
            date_end: d,
        }
    }
}

#[derive(Debug)]
struct Error;

async fn main_cli() -> Result<(), Error> {
    let mut buf = BookLib::new();

    // データ入力
    loop {
        let isbn = match input::<String>("Input isbn").await {
            Some(s) => s,
            None => break,
        };

        // let book_details = fetch_book_attr(isbn).await?;

        let read_status =
            match input::<u8>("Select read status\n1: Read\n2: Reading\n3: Unread").await {
                Some(s) => match s {
                    1 => ReadStatus::Read,
                    2 => ReadStatus::Reading,
                    _ => ReadStatus::Unread,
                },
                None => break,
            };

        let (date_start, date_end) = (
            match input::<NaiveDate>("Input date you started reading as \"%Y-%m-%d\"").await {
                Some(s) => s,
                None => break,
            },
            match input::<NaiveDate>("Input date you finished reading as \"%Y-%m-%d\"").await {
                Some(s) => s,
                None => break,
            },
        );
        let date = Date {
            date_start,
            date_end,
        };

        // let mut pages = &book_details.pages;
        let mut pages = Pages::new(200);
        let (page_start, page_end) = if read_status == ReadStatus::Read {
            (1, pages.max)
        } else if read_status == ReadStatus::Reading {
            (
                match input::<u32>("Input page you started reading").await {
                    Some(s) => s,
                    None => break,
                },
                match input::<u32>("Input page you finished reading").await {
                    Some(s) => s,
                    None => break,
                },
            )
        } else {
            (0, 0)
        };
        pages.set(page_start, page_end);

        let book_details = BookAttr {
            title: "dummy_book".to_owned(),
            isbn,
            author: "udachaaaaan".to_owned(),
            pages,
            read_status,
            date,
        };
        // デバッグ用ここまで
        buf.push(book_details);
    }
    if let Err(e) = write_to_file(buf).await {
        println!("{}", e);
    };
    Ok(())
}

async fn input<T>(msg: &str) -> Option<T>
where
    T: FromStr,
    <T as FromStr>::Err: std::fmt::Debug + std::fmt::Display,
{
    println!("{}", msg);
    let mut buf = String::new();
    loop {
        io::stdin()
            .read_line(&mut buf)
            .expect("Failed to read line.");
        if buf == "q\n" {
            return None;
        }
        match buf[..buf.len() - 1].parse::<T>() {
            Ok(s) => {
                return Some(s);
            }
            Err(e) => println!("{}", e),
        }
    }
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
    let max = attr["pageCount"].as_i64().unwrap() as u32;
    let image_url = attr["imageLinks"]["smallThumbnail"]
        .as_str()
        .unwrap()
        .to_owned();
    let mut attr = BookAttr::new();
    attr.isbn = isbn;
    attr.title = title;
    attr.author = author;
    attr.pages.max = max;
    Ok(attr)
}

async fn write_to_file(buf: BookLib) -> Result<(), std::io::Error> {
    const PATH: &str = "shelf.json";
    println!("data writing");
    let mut written = BookLib::new();
    if let Ok(_) = File::open(PATH) {
        let content = std::fs::read_to_string(PATH)?;
        written = match serde_json::from_str(&content) {
            Ok(b) => b,
            Err(e) => {
                println!("{}", e);
                written
            }
        };
    }
    written.merge(buf);
    let mut file = File::create(PATH)?;
    let json = serde_json::to_string(&written)?;
    write!(file, "{}", json)?;
    file.flush()?;
    println!("finished");
    Ok(())
}
