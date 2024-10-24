use serde::{Deserialize, Serialize};
use std::fs;
use std::{collections::HashMap, path::PathBuf, sync::Mutex};

//
// DBに保存する情報 -> (Vec<BookInfo>, Vec<Activity>)
//

#[derive(Serialize, Deserialize)]
pub struct BookInfo {
    isbn: u64,
    title: String,
    subtitle: String,
    authors: Vec<String>,
    image_url: String,
    total_page_count: u32,
}
impl std::fmt::Display for BookInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} {}", self.title, self.subtitle)
    }
}

#[derive(Serialize, Deserialize)]
pub struct Activity {
    isbn: u64,
    range: [u32; 2],
    date: String,
    memo: String,
    star: u8,
}

// 各本に紐づけられた情報を束ねる
pub struct Bookshelf {
    books: Mutex<HashMap<u64, BookInfo>>,
    diaries: Mutex<Vec<Activity>>,
    path: Mutex<PathBuf>,
}
impl Bookshelf {
    pub fn add(&self, book_info: BookInfo, activity: Activity) {
        let mut books = self.books.lock().unwrap();
        books.insert(book_info.isbn, book_info);
        let mut diaries = self.diaries.lock().unwrap();
        diaries.push(activity);
    }

    pub fn load(path: &PathBuf) -> Self {
        // ファイルの中身を読み込む
        let json = match fs::read_to_string(path) {
            Ok(str) => str,
            Err(_) => "".to_string(),
        };
        // パースする
        let bookshelf_json: (Vec<BookInfo>, Vec<Activity>) = match serde_json::from_str(&json) {
            Ok(bookshelf) => bookshelf,
            Err(_) => (vec![], vec![]),
        };
        // データをハッシュマップにして構造体に格納する
        let mut books = HashMap::new();
        for book in bookshelf_json.0 {
            books.insert(book.isbn, book);
        }
        let diaries = bookshelf_json.1;

        Self {
            books: Mutex::new(books),
            diaries: Mutex::new(diaries),
            path: Mutex::new(path.clone()),
        }
    }

    pub fn save(&self) {
        let books = self.books.lock().unwrap();
        let books: Vec<&BookInfo> = books.values().collect();
        let diaries = self.diaries.lock().unwrap();
        let diaries: Vec<&Activity> = diaries.iter().collect();

        let json = serde_json::to_string(&(&books, &diaries)).unwrap();
        let path = self.path.lock().unwrap();
        fs::create_dir_all(&path.parent().unwrap()).unwrap();
        fs::File::create(&*path).unwrap();
        fs::write(&*path, json).unwrap();
    }

    pub fn refresh(&self, path: PathBuf) {
        *self.path.lock().unwrap() = path;
        self.save();
    }
}

//
// 検索クエリ
//

#[derive(Serialize, Deserialize)]
pub struct Query {
    date_range: [String; 2],
    star_range: [u8; 2],
    order: Order,
    key: Key,
}

#[derive(Serialize, Deserialize)]
enum Order {
    Desc,
    Asc,
}

#[derive(Serialize, Deserialize)]
enum Key {
    Date,
    Star,
    Title,
    Page,
}
