/// 問題点
/// - booklibのmerge時にread_page_numを計算してない
/// - booklibのmerge時にflag_combinedを計算してない
/// - booklibのmerge時にread_statusを計算してない
use chrono::NaiveDate;
use config::Config;
use reqwest::get;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::File;
use std::io::{self, Write};
use std::ops::{Index, IndexMut};
use std::str::FromStr;

pub mod config;

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

    /// 2つのBookLibの重複をチェックしながら統合する。
    fn merge(&mut self, client: BookLib) {
        for i in 0..client.len() {
            // selfに1つもない場合はclientLibの最初の1つをselfに入れないと重複チェックもクソもない
            let attr = BookAttr::copy(&client[i]);

            if self.len() == 0 {
                self.push(attr);
                continue;
            }
            for j in 0..self.len() {
                if attr.isbn == self[j].isbn {
                    self[j].status.progresses.extend(attr.status.progresses);
                    break;
                }
                if j == self.len() - 1 {
                    self.push(attr);
                    break;
                }
            }
        }
    }

    fn push(&mut self, v: BookAttr) {
        self.items.push(v);
    }
}
impl Index<usize> for BookLib {
    type Output = BookAttr;

    fn index(&self, i: usize) -> &Self::Output {
        &self.items[i]
    }
}
impl IndexMut<usize> for BookLib {
    fn index_mut(&mut self, i: usize) -> &mut Self::Output {
        &mut self.items[i]
    }
}

// 1冊の本に対する各属性
#[derive(Debug, Deserialize, Serialize)]
struct BookAttr {
    title: String,
    isbn: String,
    author: String,
    page_max: u32,
    status: Status,
}
impl BookAttr {
    fn new() -> BookAttr {
        BookAttr {
            title: String::new(),
            isbn: String::new(),
            author: String::new(),
            page_max: 0,
            status: Status {
                read_status: ReadStatus::Unread,
                read_page_num: 0,
                progresses: vec![Progress::new()],
                flag_combined: ReadFlag::new(),
            },
        }
    }
    fn copy(attr: &BookAttr) -> BookAttr {
        let mut progresses = vec![];
        for p in &attr.status.progresses {
            let progress = Progress {
                date_start: p.date_start,
                date_end: p.date_end,
                flag: ReadFlag::from_str(&p.flag.str),
            };
            progresses.push(progress);
        }
        BookAttr {
            title: attr.title.to_owned(),
            isbn: attr.isbn.to_owned(),
            author: attr.author.to_owned(),
            page_max: attr.page_max,
            status: Status {
                read_status: attr.status.read_status,
                read_page_num: attr.status.read_page_num,
                progresses,
                flag_combined: ReadFlag::from_str(&attr.status.flag_combined.str),
            },
        }
    }
}

// その本の状態
#[derive(Debug, Deserialize, Serialize)]
struct Status {
    read_status: ReadStatus,
    read_page_num: u32,
    progresses: Vec<Progress>,
    flag_combined: ReadFlag,
}

// 読書進捗
#[derive(Debug, Deserialize, Serialize)]
struct Progress {
    date_start: NaiveDate,
    date_end: NaiveDate,
    flag: ReadFlag,
}
impl Progress {
    fn new() -> Progress {
        let d = "2002-09-22".parse::<NaiveDate>().unwrap(); // my birthday! woo
        Progress {
            date_start: d,
            date_end: d,
            flag: ReadFlag::new(),
        }
    }
    fn from(
        page_max: u32,
        page_start: u32,
        page_end: u32,
        date_start: NaiveDate,
        date_end: NaiveDate,
    ) -> Progress {
        let mut flag = ReadFlag::new();
        let flag_size = (((page_max + 7) / 8) * 2) as usize;
        while flag.str.len() < flag_size {
            flag.str += "0";
        }

        let mut bools = vec![false; (((page_max + 7) / 8) * 8) as usize];
        // フラグを編集して読んだページ数を加算
        if page_start > 0 {
            for i in page_start..=page_end {
                let i = i as usize - 1;
                if !bools[i] {
                    bools[i] = true;
                }
            }
        }
        // 16進文字列に圧縮
        flag = ReadFlag::hex_from_bool(&bools);
        Progress {
            date_start,
            date_end,
            flag,
        }
    }
}

// 読んだページのフラグ
#[derive(Debug, Serialize, Deserialize)]
struct ReadFlag {
    str: String,
}
impl ReadFlag {
    fn new() -> ReadFlag {
        ReadFlag { str: String::new() }
    }
    fn from_str(str: &str) -> ReadFlag {
        let str = str.to_owned();
        ReadFlag { str }
    }
    fn byte(&mut self) -> Vec<u8> {
        let mut bytes = vec![];
        if self.str.len() % 2 == 1 {
            self.str += "0";
        }
        for i in (0..self.str.len()).step_by(2) {
            let c = &self.str[i..i + 2];
            let n = u8::from_str_radix(c, 16).unwrap();
            bytes.push(n);
        }
        bytes
    }
    fn bool(&mut self) -> Vec<bool> {
        ReadFlag::bool_from_byte(&self.byte())
    }
    fn hex_from_byte(bytes: &Vec<u8>) -> ReadFlag {
        let mut hex = String::new();
        for byte in bytes {
            hex += &format!("{:02x}", byte);
        }
        ReadFlag { str: hex }
    }
    fn hex_from_bool(bools: &Vec<bool>) -> ReadFlag {
        ReadFlag::hex_from_byte(&ReadFlag::byte_from_bool(&bools))
    }
    fn byte_from_bool(bools: &Vec<bool>) -> Vec<u8> {
        let mut byte = vec![];
        let mut bit: u8 = 0b0;
        for i in 0..bools.len() {
            bit <<= 1;
            bit += if bools[i] { 1 } else { 0 };
            if i % 8 == 7 {
                byte.push(bit);
                bit = 0b0;
            }
        }
        byte
    }
    fn bool_from_byte(bytes: &Vec<u8>) -> Vec<bool> {
        let mut bools = vec![];
        for n in bytes.into_iter() {
            for i in (0..8).rev() {
                bools.push(n & 2_u8.pow(i) == 2_u8.pow(i));
            }
        }
        bools
    }
}

// 本の状態 読了/進行中/未読
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
enum ReadStatus {
    Read,
    Reading,
    Unread,
}

#[derive(Debug)]
pub struct Error;

pub async fn main_cli(cfg: Config) -> Result<(), Error> {
    let mut buf = BookLib::new();

    // データ入力
    loop {
        let isbn = match input::<String>("Input isbn") {
            Some(s) => s,
            None => break,
        };

        let mut book_details = if cfg.debug {
            BookAttr {
                title: String::from("udachan books vol.1"),
                isbn,
                author: String::from("udachan"),
                page_max: 99,
                status: Status {
                    read_status: ReadStatus::Unread,
                    read_page_num: 0,
                    progresses: vec![Progress::new()],
                    flag_combined: ReadFlag::from_str("00"),
                },
            }
        } else {
            fetch_book_attr(isbn).await?
        };

        println!("{} 『{}』", book_details.author, book_details.title);

        let read_status = match input::<u8>("Select read status\n1: Read\n2: Reading\n3: Unread") {
            Some(s) => match s {
                1 => ReadStatus::Read,
                2 => ReadStatus::Reading,
                _ => ReadStatus::Unread,
            },
            None => break,
        };
        let (date_start, date_end) = if read_status == ReadStatus::Unread {
            (
                NaiveDate::parse_from_str("2002-09-22", "%Y-%m-%d").unwrap(),
                NaiveDate::parse_from_str("2002-09-22", "%Y-%m-%d").unwrap(),
            )
        } else {
            (
                match input::<NaiveDate>("Input date you started reading as \"%Y-%m-%d\"") {
                    Some(s) => s,
                    None => break,
                },
                match input::<NaiveDate>("Input date you finished reading as \"%Y-%m-%d\"") {
                    Some(s) => s,
                    None => break,
                },
            )
        };
        let (page_start, page_end) = if read_status == ReadStatus::Read {
            (1, book_details.page_max)
        } else if read_status == ReadStatus::Reading {
            (
                match input::<u32>("Input page you started reading") {
                    Some(s) => s,
                    None => break,
                },
                match input::<u32>("Input page you finished reading") {
                    Some(s) => s,
                    None => break,
                },
            )
        } else {
            (0, 0)
        };
        let progress = Progress::from(
            book_details.page_max,
            page_start,
            page_end,
            date_start,
            date_end,
        );
        let status = Status {
            read_status,
            read_page_num: page_end - page_start + 1,
            flag_combined: ReadFlag::from_str(&progress.flag.str),
            progresses: vec![progress],
        };
        book_details.status = status;
        buf.push(book_details);
    }
    if let Err(e) = write_to_file(&cfg, buf) {
        println!("{}", e);
    };
    Ok(())
}

fn input<T>(msg: &str) -> Option<T>
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
    let page_max = attr["pageCount"].as_i64().unwrap() as u32;
    let image_url = attr["imageLinks"]["smallThumbnail"]
        .as_str()
        .unwrap()
        .to_owned();
    let mut attr = BookAttr::new();
    attr.isbn = isbn;
    attr.title = title;
    attr.author = author;
    attr.page_max = page_max;
    Ok(attr)
}

fn write_to_file(cfg: &Config, buf: BookLib) -> Result<(), std::io::Error> {
    let path = String::from(&cfg.dir) + &cfg.shelf;
    println!("data writing");
    let mut written = BookLib::new();
    if let Ok(_) = File::open(&path) {
        let content = std::fs::read_to_string(&path)?;
        written = match serde_json::from_str(&content) {
            Ok(b) => b,
            Err(e) => {
                println!("{}", e);
                written
            }
        };
    }
    written.merge(buf);
    if let Err(e) = std::fs::create_dir_all(&cfg.dir) {
        println!("{}", e);
    };
    let mut file = File::create(&path)?;
    let json = serde_json::to_string(&written)?;
    write!(file, "{}", json)?;
    file.flush()?;
    println!("finished");
    Ok(())
}
