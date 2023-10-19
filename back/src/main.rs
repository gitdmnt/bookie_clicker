// BookLibのマージ作業をやる　次は
// 今の実装だと新たに記録したやつのフラグが統合されるだけ
// 問題点
// - 日付が更新されない
// - いつどこを読んだかわからない
// - numを再計算してない
// - Unreadの場合でも読み始めた日と読み終わった日を聞かれる
// まずはBookAttrを改修する
// フラグと日付をバラバラに載せるのではなく、読書期間とフラグが同時に載っている構造体のリストという形にする
// dateとpageとread_statusを削除し、max_page, u32, status: Statusにする
// struct Status { read_status: ReadStatus, read_page_num: u32, progresses: Vec<Progress>, read_flags_combined: String }
// struct Progress { date_start, date_end, read_flags }

use back::byte2hex;
use chrono::{self, Local, NaiveDate};
use lib::{bool2hex, hex2bool, hex2byte};
use reqwest::get;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::File;
use std::io::{self, Write};
use std::str::FromStr;

mod lib;

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
    fn len(&self) -> usize {
        self.items.len()
    }
    fn merge(&mut self, v: BookLib) {
        // 同じ本が登録された時の処理
        if self.len() == 0 {
            self.items.extend(v.items);
            return;
        }
        for i in 0..v.len() {
            let attr_new = &v.items[i];
            for j in 0..self.len() {
                let attr_exist = &mut self.items[j];
                if attr_new.isbn == attr_exist.isbn {
                    // フラグをデコードしてOR取って再エンコード
                    let read_flag_exist = hex2byte(&attr_exist.pages.read_flags);
                    let read_flag_new = hex2byte(&attr_new.pages.read_flags);
                    attr_exist.pages.read_flags = byte2hex(
                        &read_flag_exist
                            .into_iter()
                            .enumerate()
                            .map(|(i, f)| (f | read_flag_new[i]))
                            .collect(),
                    );
                    break;
                }

                // 既存のと一致しなかったらコピーするコードだけど汚すぎて面白い
                if j == self.len() - 1 {
                    let attr = BookAttr {
                        title: (&attr_new.title).to_owned(),
                        isbn: (&attr_new.isbn).to_owned(),
                        pages: Pages {
                            max: attr_new.pages.max,
                            num: attr_new.pages.num,
                            read_flags: (&attr_new.pages.read_flags).to_owned(),
                        },
                        read_status: attr_new.read_status,
                        author: (&attr_new.author).to_owned(),
                        date: attr_new.date,
                    };
                    self.push(attr);
                }
            }
        }
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
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
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
        // nページの本には(n+3)/4文字のフラグ文字列だが、フラグ文字列は偶数である必要があるのでさらにそれを丸めて(((n+3)/4+1)/2)*2=((n+7)/8)*2文字
        let flag_size = ((max + 7) / 8) * 2;
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
        let mut read_flags = hex2bool(&self.read_flags);
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
        self.read_flags = bool2hex(&read_flags);
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
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
