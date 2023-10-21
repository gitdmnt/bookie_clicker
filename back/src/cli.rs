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
pub struct BookLib {
    pub items: Vec<BookAttr>,
}
impl BookLib {
    pub fn new() -> BookLib {
        BookLib { items: vec![] }
    }
    pub fn write(self, cfg: &Config) -> Result<(), std::io::Error> {
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
        written.merge(self);
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
                    // progressを参照してstatusを更新する
                    let mut flag_combined = self[j].status.flag_combined.byte();
                    for p in &self[j].status.progresses {
                        let f = p.flag.byte();
                        for k in 0..f.len() {
                            flag_combined[k] |= f[k];
                        }
                    }
                    let read_page_num = ReadFlag::bool_from_byte(&flag_combined)
                        .into_iter()
                        .filter(|b| *b)
                        .count() as u32;
                    let page_max = self[j].page_max;
                    let read_status = if page_max == read_page_num {
                        ReadStatus::Read
                    } else if read_page_num == 0 {
                        ReadStatus::Unread
                    } else {
                        ReadStatus::Reading
                    };
                    self[j].status.flag_combined = ReadFlag::hex_from_byte(&flag_combined);
                    self[j].status.read_page_num = read_page_num;
                    self[j].status.read_status = read_status;
                    break;
                }
                if j == self.len() - 1 {
                    self.push(attr);
                    break;
                }
            }
        }
    }
    pub fn push(&mut self, v: BookAttr) {
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
pub struct BookAttr {
    title: String,
    isbn: String,
    author: String,
    page_max: u32,
    status: Status,
}
impl BookAttr {
    pub fn new() -> BookAttr {
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
    fn from(
        title: String,
        isbn: String,
        author: String,
        page_max: u32,
        status: Status,
    ) -> BookAttr {
        BookAttr {
            title,
            isbn,
            author,
            page_max,
            status,
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
    fn input_isbn() -> Result<String, String> {
        match input::<String>("Input isbn") {
            Some(s) => Ok(s),
            None => Err(String::from("quit")),
        }
    }
    pub async fn fetch_book_attr() -> Result<BookAttr, String> {
        let isbn = BookAttr::input_isbn()?;
        let url = format!(
            "https://www.googleapis.com/books/v1/volumes?q=isbn:{}",
            isbn
        );
        let attr = get(url).await;
        let attr = match attr {
            Ok(json) => parse_json_to_attribute(json).await,
            Err(e) => {
                println!("{}", e);
                Err(String::from("No result"))
            }
        };

        attr
    }
    pub fn debug_book_attr() -> Result<BookAttr, String> {
        let isbn = BookAttr::input_isbn()?;
        let status = Status::new();
        let attr = BookAttr {
            title: String::from("udachan books vol.1"),
            isbn,
            author: String::from("udachan"),
            page_max: 99,
            status,
        };
        Ok(attr)
    }
    pub fn set_status(&mut self) -> Result<(), String> {
        let read_status = match input::<u8>("Select read status\n1: Read\n2: Reading\n3: Unread") {
            Some(s) => match s {
                1 => ReadStatus::Read,
                2 => ReadStatus::Reading,
                _ => ReadStatus::Unread,
            },
            None => return Err(String::from("quit")),
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
                    None => return Err(String::from("quit")),
                },
                match input::<NaiveDate>("Input date you finished reading as \"%Y-%m-%d\"") {
                    Some(s) => s,
                    None => return Err(String::from("quit")),
                },
            )
        };
        let (page_start, page_end) = if read_status == ReadStatus::Read {
            (1, self.page_max)
        } else if read_status == ReadStatus::Reading {
            (
                match input::<u32>("Input page you started reading") {
                    Some(s) => s,
                    None => return Err(String::from("quit")),
                },
                match input::<u32>("Input page you finished reading") {
                    Some(s) => s,
                    None => return Err(String::from("quit")),
                },
            )
        } else {
            (0, 0)
        };
        let progress = Progress::from(self.page_max, page_start, page_end, date_start, date_end);
        let flag_combined = progress.flag().copy();
        let status = Status::from(
            read_status,
            page_end - page_start + 1,
            vec![progress],
            flag_combined,
        );
        self.status = status;
        Ok(())
    }
    pub fn print_attr(&self) {
        println!("{} 『{}』", self.author, self.title);
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
impl Status {
    pub fn new() -> Status {
        Status {
            read_status: ReadStatus::Unread,
            read_page_num: 0,
            progresses: vec![Progress::new()],
            flag_combined: ReadFlag::new(),
        }
    }
    pub fn from(
        read_status: ReadStatus,
        read_page_num: u32,
        progresses: Vec<Progress>,
        flag_combined: ReadFlag,
    ) -> Status {
        Status {
            read_status,
            read_page_num,
            progresses,
            flag_combined,
        }
    }
}

// 読書進捗
#[derive(Debug, Deserialize, Serialize)]
struct Progress {
    date_start: NaiveDate,
    date_end: NaiveDate,
    flag: ReadFlag,
}
impl Progress {
    pub fn new() -> Progress {
        let d = "2002-09-22".parse::<NaiveDate>().unwrap(); // my birthday! woo
        Progress {
            date_start: d,
            date_end: d,
            flag: ReadFlag::new(),
        }
    }
    pub fn from(
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
    pub fn flag(&self) -> &ReadFlag {
        &self.flag
    }
}

// 読んだページのフラグ
#[derive(Debug, Serialize, Deserialize)]
pub struct ReadFlag {
    pub str: String,
}
impl ReadFlag {
    pub fn new() -> ReadFlag {
        ReadFlag { str: String::new() }
    }
    pub fn from_str(str: &str) -> ReadFlag {
        let str = str.to_owned();
        ReadFlag { str }
    }
    pub fn copy(&self) -> ReadFlag {
        ReadFlag::from_str(&self.str)
    }
    pub fn byte(&self) -> Vec<u8> {
        let mut bytes = vec![];
        for i in (0..self.str.len()).step_by(2) {
            let c = &self.str[i..i + 2];
            let n = u8::from_str_radix(c, 16).unwrap();
            bytes.push(n);
        }
        bytes
    }
    pub fn bool(&self) -> Vec<bool> {
        ReadFlag::bool_from_byte(&self.byte())
    }
    fn hex_from_byte(bytes: &Vec<u8>) -> ReadFlag {
        let mut hex = String::new();
        for byte in bytes {
            hex += &format!("{:02x}", byte);
        }
        ReadFlag { str: hex }
    }
    pub fn hex_from_bool(bools: &Vec<bool>) -> ReadFlag {
        ReadFlag::hex_from_byte(&ReadFlag::byte_from_bool(&bools))
    }
    pub fn byte_from_bool(bools: &Vec<bool>) -> Vec<u8> {
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
    pub fn bool_from_byte(bytes: &Vec<u8>) -> Vec<bool> {
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
pub enum ReadStatus {
    Read,
    Reading,
    Unread,
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

async fn parse_json_to_attribute(json: reqwest::Response) -> Result<BookAttr, String> {
    let str = json.text().await.unwrap();
    let vec: Value = serde_json::from_str(&str).unwrap();
    let total_item_count = vec["totalItems"].as_i64().unwrap();
    if total_item_count == 0 {
        return Err(String::from("No result"));
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
    let attr = BookAttr::from(title, isbn, author, page_max, Status::new());
    Ok(attr)
}
