use serde::{Deserialize, Serialize};
use std::fs;
use std::{collections::HashMap, path::PathBuf, sync::Mutex};

//
// DBに保存する情報 -> (Vec<BookInfo>, Vec<Activity>)
//

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct BookInfo {
    pub isbn: u64,
    pub title: String,
    pub subtitle: String,
    pub authors: Vec<String>,
    pub image_url: String,
    pub total_page_count: u32,
}
impl std::fmt::Display for BookInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} {}", self.title, self.subtitle)
    }
}
impl BookInfo {
    pub fn new(
        isbn: u64,
        title: String,
        subtitle: String,
        authors: Vec<String>,
        image_url: String,
        total_page_count: u32,
    ) -> Self {
        Self {
            isbn,
            title,
            subtitle,
            authors,
            image_url,
            total_page_count,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct Activity {
    isbn: u64,
    range: [u32; 2],
    date: String,
    memo: String,
    rating: u8,
}
impl Activity {
    pub fn new(isbn: u64, range: [u32; 2], date: String, memo: String, rating: u8) -> Self {
        Self {
            isbn,
            range,
            date,
            memo,
            rating,
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Container {
    book: BookInfo,
    diaries: Vec<Activity>,
}
impl Container {
    pub fn new(book: BookInfo, diaries: Vec<Activity>) -> Self {
        Self { book, diaries }
    }
    pub fn isbn(&self) -> u64 {
        self.book.isbn
    }
}

// 各本に紐づけられた情報を束ねる
pub struct Bookshelf {
    books: Mutex<HashMap<u64, BookInfo>>,
    diaries: Mutex<Vec<Activity>>,
    path: Mutex<PathBuf>,
}
impl Bookshelf {
    pub fn new() -> Self {
        Self {
            books: Mutex::new(HashMap::new()),
            diaries: Mutex::new(Vec::new()),
            path: Mutex::new(PathBuf::new()),
        }
    }

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

    pub fn search(&self, query: Query) -> Vec<Container> {
        let books = self.books.lock().unwrap();
        let diaries = self.diaries.lock().unwrap();
        let books = books.values().collect::<Vec<&BookInfo>>();

        // 絞り込み
        let term = query.term;
        let rating = query.rating;
        let diaries = diaries
            .iter()
            .filter(|d| *d.date >= *term[0] && *d.date <= *term[1])
            .filter(|d| d.rating >= rating[0] && d.rating <= rating[1])
            .collect::<Vec<&Activity>>();

        let containers: Vec<Container> = books
            .into_iter()
            .map(|b| Container {
                book: b.clone(),
                diaries: diaries
                    .iter()
                    .filter(|d| d.isbn == b.isbn)
                    .map(|d| (*d).clone())
                    .collect::<Vec<Activity>>(),
            })
            .filter(|r| !r.diaries.is_empty())
            .collect();

        let mut containers = containers
            .into_iter()
            .map(|mut r| match query.order {
                Order::Desc => {
                    r.diaries.sort_by(|a, b| a.date.cmp(&b.date));
                    r
                }
                Order::Asc => {
                    r.diaries.sort_by(|a, b| b.date.cmp(&a.date));
                    r
                }
            })
            .collect::<Vec<Container>>();

        // ソート
        let containers = match query.key {
            Key::Date => {
                containers.sort_by(|a, b| a.diaries[0].date.cmp(&b.diaries[0].date));
                containers
            }
            Key::Rating => {
                containers.sort_by(|a, b| a.diaries[0].rating.cmp(&b.diaries[0].rating));
                containers
            }
            Key::Title => {
                containers.sort_by(|a, b| a.book.title.cmp(&b.book.title));
                containers
            }
            Key::Page => {
                containers.sort_by(|a, b| a.book.total_page_count.cmp(&b.book.total_page_count));
                containers
            }
        };
        let containers = match query.order {
            Order::Desc => containers,
            Order::Asc => containers.into_iter().rev().collect(),
        };

        containers
    }
}

//
// 検索クエリ
//

#[derive(Serialize, Deserialize)]
pub struct Query {
    term: [String; 2],
    rating: [u8; 2],
    order: Order,
    key: Key,
}

#[derive(Serialize, Deserialize)]
pub enum Order {
    Desc,
    Asc,
}

#[derive(Serialize, Deserialize)]
pub enum Key {
    Date,
    Rating,
    Title,
    Page,
}

impl Query {
    pub fn new(term: [String; 2], rating: [u8; 2], order: Order, key: Key) -> Self {
        Self {
            term,
            rating,
            order,
            key,
        }
    }
}
