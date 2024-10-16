// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

use bookie_clicker::config::{Config, ConfigManager};
use bookie_clicker::database::{Activity, BookAttr, Books, Library, Record};

use dirs;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

// 本の情報をAPIを叩いて検索して返す
#[tauri::command]
async fn set_book_attr(
    cfg: tauri::State<'_, ConfigManager>,
    isbn: String,
) -> Result<BookAttr, String> {
    let debug = cfg.get().debug;

    println!("fetching isbn: {}", isbn);
    let attr = if debug {
        BookAttr::fake(&isbn)
    } else {
        BookAttr::from_isbn(&isbn).await
    };
    println!("{:?}", attr);
    attr
}

// 保存する
#[tauri::command]
fn set_record(lib: tauri::State<'_, Library>, book_attr: BookAttr, activity: Activity) {
    let rec = Record::from(book_attr, activity);
    println!("{:?}", rec);
    lib.add(rec);
    lib.save()
}

// configを読み込み
#[tauri::command]
fn fetch_config(cfg: tauri::State<'_, ConfigManager>) -> Config {
    let mut config = cfg.fetch();
    config.dir_path = config.dir_path.join("lib.json");
    config
}

// configに書き込み
#[tauri::command]
fn set_config(cfg: tauri::State<'_, ConfigManager>, mut config: Config) {
    let dir_path: PathBuf = dirs::config_dir().unwrap().join(".bookie_clicker");
    let config_path = dir_path.join("config.json");
    config.dir_path = config.dir_path.parent().unwrap().to_path_buf();
    println!("{:?}", config);
    cfg.set(&config_path, config);
}

// DBからレコードを読みたい
#[tauri::command]
fn fetch_new(lib: tauri::State<'_, Library>) -> Books {
    // 今は返す型を適当にしてるけど、いずれもっと最適化した型で返したい
    let rec = lib.fetch_all();
    rec
}

fn main() {
    let dir_path: PathBuf = dirs::config_dir().unwrap().join(".bookie_clicker");
    let config_path = dir_path.join("config.json");
    let cfg = ConfigManager::load(&config_path);

    let lib_path = &cfg.get().dir_path.join("lib.json");
    let lib = Library::load(lib_path);

    tauri::Builder::default()
        .manage(cfg)
        .manage(lib)
        .invoke_handler(tauri::generate_handler![
            set_book_attr,
            set_record,
            set_config,
            fetch_config,
            fetch_new,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
