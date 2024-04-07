use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

use tauri::async_runtime::block_on;

use surrealdb::engine::local::{Db, Mem};
use surrealdb::Surreal;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use base64ct::{Base64, Encoding};
use chrono::NaiveDate;
use reqwest::get;

const CURRENT_DB_VERSION: u32 = 1;

// jsonのデータをDBに入れて扱いやすくしている。
// 将来的には普通にファイルとしてのDBで保存しておいて、たまにjsonに書き出せるようにすべきなのかも？

pub struct Library {
    path: PathBuf,
    db: Mutex<Surreal<Db>>,
}

impl Library {
    // on-memのDBをMutexに包んで返す
    fn new(path: &PathBuf) -> Library {
        let create_new_db = async {
            let db = Surreal::new::<Mem>(()).await.unwrap();
            db.use_ns("namespace").use_db("database").await.unwrap();
            db
        };
        let db = block_on(create_new_db);
        Library {
            path: path.to_path_buf(),
            db: Mutex::new(db),
        }
    }

    // on-memのDBにjsonを移して返す
    pub fn load(path: &PathBuf) -> Library {
        let lib = Library::new(path);
        let copy_json_to_db = async {
            let db = lib.db.lock().unwrap();

            // ここから
            println!("Loading lib.json from {:?}", path);

            // ファイルから文字列を読み込む
            let books = match fs::read_to_string(path) {
                Ok(str) => str,
                Err(_) => {
                    // 読み込めない場合は新しいファイルを作って空文字列を返す
                    fs::create_dir_all(path.parent().unwrap()).unwrap_or_else(|why| {
                        println!("! {:?}", why.kind());
                    });
                    fs::File::create(path).unwrap();
                    String::new()
                }
            };

            // パースするだけ
            let books: Books = match serde_json::from_str(&books) {
                Ok(json) => {
                    println!("Load lib.json successfully");
                    json
                }
                Err(e) => {
                    println!("{e}");
                    Books {
                        version: CURRENT_DB_VERSION,
                        items: vec![],
                    }
                }
            };
            //ここまで

            for b in books {
                let _: Option<Record> = db.create(("book", &b.attr.isbn)).content(b).await.unwrap();
            }
        };
        block_on(copy_json_to_db);
        lib
    }

    // on-memのDBをjsonに保存する。
    pub fn save(&self) {
        let db = self.db.lock().unwrap();
        let books: Vec<Record> = block_on(async {
            db.query("select * from book")
                .await
                .unwrap()
                .take(0)
                .unwrap()
        });
        let books = Books {
            version: CURRENT_DB_VERSION,
            items: books,
        };
        println!("Saving on {:?}", self.path);
        let books: String = serde_json::to_string(&books).unwrap();
        let mut file = fs::File::create(&self.path).unwrap();
        file.write_all(books.as_bytes()).unwrap();
    }

    // 新しいデータを追加する。
    pub fn add(&self, new: Record) {
        let db = self.db.lock().unwrap();
        let select_task = async {
            db.query("select * from book where attr.isbn = $isbn")
                .bind(("isbn", &new.attr.isbn))
                .await
                .unwrap()
                .take::<Vec<Record>>(0)
                .unwrap()
        };
        let mut rec = block_on(select_task);
        let rec = match rec.get_mut(0) {
            Some(r) => {
                r.merge(new);
                r
            }
            None => &new,
        };

        let update_task = async {
            let _: Option<Record> = db
                .update(("book", &rec.attr.isbn))
                .content(rec)
                .await
                .unwrap();
        };
        block_on(update_task);
    }

    // 全データを取得する。
    pub fn fetch_all(&self) -> Books {
        let db = self.db.lock().unwrap();
        let select_task = async { db.select("book").await.unwrap() };
        let mut books = block_on(select_task);
        books.sort_by_key(|k: &Record| k.status.last_read);
        books.reverse();
        for b in &books {
            println!("{:?}", b);
        }
        let rec = Books {
            version: CURRENT_DB_VERSION,
            items: books,
        };
        rec
    }
}

// 基本的にliburary.rsから呼び出されてるだけ。Recordの配列。jsonに記録するのはこれ
#[derive(Debug, Deserialize, Serialize)]
pub struct Books {
    version: u32,
    items: Vec<Record>,
}

// for book in booksがやりたいだけ
impl IntoIterator for Books {
    type Item = Record;
    type IntoIter = <Vec<Record> as IntoIterator>::IntoIter;
    fn into_iter(self) -> Self::IntoIter {
        self.items.into_iter()
    }
}

// 本の情報とそれに関する行動の履歴をまとめておくコンテナ
#[derive(Debug, Deserialize, Serialize)]
pub struct Record {
    pub attr: BookAttr,
    status: Status,
}

impl Record {
    pub fn from(attr: BookAttr, mut activity: Activity) -> Record {
        // ぐちゃぐちゃの入力データを直す会
        activity.normalize(&attr);
        let status = Status::from(&attr, activity);
        Record { attr, status }
    }
    pub fn merge(&mut self, new: Record) {
        self.status.merge(new.status);
    }
}

// 本の情報
#[derive(Debug, Deserialize, Serialize)]
pub struct BookAttr {
    pub isbn: String,
    title: String,
    subtitle: String,
    authors: Vec<String>,
    #[serde(rename = "imageUrl")]
    image_url: String,
    #[serde(rename = "totalPageCount")]
    total_page_count: u32,
}

impl BookAttr {
    pub async fn from_isbn(isbn: &str) -> Result<BookAttr, String> {
        // Google Books APIにリクエスト
        let mut isbn = isbn.to_owned();
        isbn.retain(|c| "0123456789".contains(c));
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
    pub fn fake(isbn: &str) -> Result<BookAttr, String> {
        Ok(BookAttr {
            isbn: String::from(isbn),
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

// ある本に関するユーザーの行動内容
#[derive(Debug, Deserialize, Serialize)]
struct Status {
    #[serde(rename = "readStatus")]
    read_status: ReadStatus,
    #[serde(rename = "combinedFlag")]
    combined_flag: ReadFlag,
    progresses: Vec<Progress>,
    #[serde(rename = "lastRead")]
    last_read: NaiveDate,
    star: u32,
}

impl Status {
    fn from(attr: &BookAttr, activity: Activity) -> Status {
        let read_flag = ReadFlag::from(attr.total_page_count, &activity.page_range);
        let progress = vec![Progress::from(
            attr,
            &activity.page_range,
            activity.term,
            activity.memo,
            activity.star,
        )];
        Status {
            read_status: activity.read_status,
            combined_flag: read_flag,
            progresses: progress,
            last_read: activity.term[1],
            star: activity.star,
        }
    }
    fn merge(&mut self, new: Status) {
        self.read_status = match self.read_status {
            ReadStatus::Read => ReadStatus::Read,
            ReadStatus::Reading => match new.read_status {
                ReadStatus::Read => ReadStatus::Read,
                _ => ReadStatus::Reading,
            },
            ReadStatus::Unread => new.read_status,
        };
        self.combined_flag.merge(new.combined_flag);
        self.progresses.extend(new.progresses);
        self.last_read = if self.last_read < new.last_read {
            new.last_read
        } else {
            self.last_read
        };
        self.star = new.star;
    }
}

// 読書情報をフロントエンドから運んでくるためのコンテナ
#[derive(Debug, Deserialize, Serialize)]
pub struct Activity {
    #[serde(rename = "readStatus")]
    read_status: ReadStatus,
    #[serde(rename = "pageRange")]
    page_range: [u32; 2],
    term: [NaiveDate; 2],
    memo: String,
    star: u32,
}

impl Activity {
    // read_statusからpage_rangeを復元したり、その逆をやったりしているz
    fn normalize(&mut self, attr: &BookAttr) {
        let max = attr.total_page_count;
        self.page_range[0] = match self.read_status {
            ReadStatus::Read => match self.page_range[0] {
                0 => 1,
                _ => self.page_range[0],
            },
            ReadStatus::Reading => self.page_range[0],
            ReadStatus::Unread => 0,
        };
        self.page_range[1] = match self.read_status {
            ReadStatus::Read => {
                if self.page_range[1] == 0 || self.page_range[1] == max {
                    max
                } else {
                    self.read_status = ReadStatus::Reading;
                    self.page_range[1]
                }
            }
            ReadStatus::Reading => self.page_range[1],
            ReadStatus::Unread => 0,
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
enum ReadStatus {
    Read,
    Reading,
    Unread,
}

// これ正直Activityと何が違うのかわからない　よりDBに記録しておきたい形なのかもね
#[derive(Debug, Deserialize, Serialize)]
struct Progress {
    #[serde(rename = "termStart")]
    term_start: NaiveDate,
    #[serde(rename = "termEnd")]
    term_end: NaiveDate,
    flag: ReadFlag,
    memo: String,
    star: u32,
}

impl Progress {
    fn from(
        attr: &BookAttr,
        page_range: &[u32; 2],
        term: [NaiveDate; 2],
        memo: String,
        star: u32,
    ) -> Progress {
        Progress {
            term_start: term[0],
            term_end: term[1],
            flag: ReadFlag::from(attr.total_page_count, page_range),
            memo: memo,
            star,
        }
    }
}

// 読んだページのフラグ
#[derive(Debug, Deserialize, Serialize)]
struct ReadFlag {
    b64: String,
}

impl ReadFlag {
    fn from(total_page_count: u32, page_range: &[u32; 2]) -> ReadFlag {
        // 1バイトで8ページ分記録できる
        // したがってページ数を8の倍数に切り上げ
        let total_page_count = (((total_page_count + 7) / 8) * 8) as usize;

        // 始ページと終ページで記録された読んだ範囲を、ページごとの読了フラグに変換
        let flag_bool = ReadFlag::range_to_bools(total_page_count, page_range);

        // 処理のためにページごとの読了フラグを8ページごとに圧縮
        let flag_byte = ReadFlag::bools_to_bytes(flag_bool);

        // 記録のために文字列化
        let flag_b64 = Base64::encode_string(&flag_byte);

        ReadFlag { b64: flag_b64 }
    }
    fn range_to_bools(len: usize, page_range: &[u32; 2]) -> Vec<bool> {
        let mut flag_bool = vec![false; len];
        if page_range[0] == 0 {
            return flag_bool;
        }
        for i in page_range[0]..page_range[1] + 1 {
            let i = i as usize;
            flag_bool[i - 1] = true;
        }
        flag_bool
    }
    fn bools_to_bytes(flag_bool: Vec<bool>) -> Vec<u8> {
        let mut flag_byte = vec![];
        let mut bit: u8 = 0b00000000;
        for i in 0..flag_bool.len() {
            bit <<= 1;
            bit += if flag_bool[i] { 1 } else { 0 };
            if i % 8 == 7 {
                flag_byte.push(bit);
                bit = 0b00000000;
            }
        }
        flag_byte
    }
    fn merge(&mut self, new: ReadFlag) {
        let old = Base64::decode_vec(&self.b64).unwrap();
        let new = Base64::decode_vec(&new.b64).unwrap();
        let mut newer = vec![];
        for i in 0..old.len() {
            newer.push(old[i] | new[i]);
        }
        let b64 = Base64::encode_string(&newer);
        self.b64 = b64;
    }
}
