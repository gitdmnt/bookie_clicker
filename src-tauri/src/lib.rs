// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use config::Config;
use data::{BookInfo, BookShelf, ReadState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = Config::load();
    let shelf = BookShelf::load(&config.shelf_path);

    tauri::Builder::default()
        .manage(shelf)
        .manage(config)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![add_record])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// レコードを追加する
#[tauri::command]
fn add_record(
    shelf: tauri::State<BookShelf>,
    book_info: BookInfo,
    read_state: ReadState,
) -> String {
    let message = format!("Added: {}", book_info);
    shelf.add(book_info, read_state);
    shelf.save();
    message
}

pub mod data {

    use serde::{Deserialize, Serialize};
    use std::fs;
    use std::{collections::HashMap, path::PathBuf, sync::Mutex};
    //
    // フロントエンドから受け取る情報
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
    pub struct ReadState {
        range: [u32; 2],
        date: String,
        memo: String,
        star: u8,
    }

    //
    // バックエンドの情報
    //

    // 各本に紐づけられた情報を束ねる
    pub struct BookShelf {
        records: Mutex<HashMap<u64, Record>>,
        path: PathBuf,
    }
    impl BookShelf {
        pub fn add(&self, book_info: BookInfo, read_state: ReadState) {
            let mut records = self.records.lock().unwrap();
            let record = records
                .entry(book_info.isbn)
                .or_insert(Record::from(book_info));
            record.merge(read_state);
        }

        pub fn load(path: &PathBuf) -> Self {
            // ファイルの中身を読み込む
            let json = match fs::read_to_string(path) {
                Ok(str) => str,
                Err(_) => "".to_string(),
            };
            // パースする
            let records_vec: Vec<Record> = match serde_json::from_str(&json) {
                Ok(shelf) => shelf,
                Err(_) => vec![],
            };
            // データをハッシュマップにして構造体に格納する
            let mut records = HashMap::new();
            for record in records_vec {
                records.insert(record.isbn, record);
            }
            Self {
                records: Mutex::new(records),
                path: path.clone(),
            }
        }

        pub fn save(&self) {
            let records = self.records.lock().unwrap();
            let records_vec: Vec<&Record> = records.values().collect();
            let json = serde_json::to_string(&records_vec).unwrap();
            fs::create_dir_all(&self.path.parent().unwrap()).unwrap();
            fs::File::create(&self.path).unwrap();
            fs::write(&self.path, json).unwrap();
        }
    }

    // 本についての総合的な情報を保持する
    #[derive(Serialize, Deserialize)]
    struct Record {
        isbn: u64,
        title: String,
        subtitle: String,
        authors: Vec<String>,
        image_url: String,
        total_page_count: u32,
        star: u8,
        memo: String,
        activity: Vec<Activity>,
    }
    impl Record {
        fn from(book_info: BookInfo) -> Self {
            Self {
                isbn: book_info.isbn,
                title: book_info.title,
                subtitle: book_info.subtitle,
                authors: book_info.authors,
                image_url: book_info.image_url,
                total_page_count: book_info.total_page_count,
                star: 0,
                memo: "".to_string(),
                activity: vec![],
            }
        }
        fn merge(&mut self, read_state: ReadState) {
            self.star = read_state.star;
            self.memo = read_state.memo;
            self.activity.push(Activity {
                date: read_state.date,
                range: read_state.range,
            });
        }
    }

    // 一回の読書情報を保持する
    #[derive(Serialize, Deserialize)]
    struct Activity {
        date: String,
        range: [u32; 2],
    }
}

pub mod config {
    use dirs;
    use serde::{Deserialize, Serialize};
    use std::{fs, path::PathBuf};

    #[derive(Deserialize, Serialize)]
    pub struct Config {
        pub shelf_path: PathBuf,
    }
    impl Config {
        fn new() -> Self {
            Self {
                shelf_path: dirs::config_dir()
                    .unwrap()
                    .join("BookieClicker")
                    .join("shelf.json"),
            }
        }

        pub fn load() -> Self {
            let path = dirs::config_dir()
                .unwrap()
                .join("BookieClicker")
                .join("config.json");
            let s = match fs::read_to_string(&path) {
                Ok(s) => s,
                Err(_) => {
                    fs::create_dir_all(&path.parent().unwrap()).unwrap();
                    fs::File::create(&path).unwrap();
                    "".to_string()
                }
            };
            let config = match serde_json::from_str(&s) {
                Ok(config) => config,
                Err(_) => Self::new(),
            };
            config
        }

        pub fn save(&self) {
            let s = serde_json::to_string(&self).unwrap();
            let path = dirs::config_dir()
                .unwrap()
                .join("BookieClicker")
                .join("config.json");

            fs::create_dir_all(&path.parent().unwrap()).unwrap();
            fs::File::create(&path).unwrap();
            fs::write(&path, s).unwrap();
        }
    }
}
