// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

use bookie_clicker::config::{Config, ConfigManager};
use bookie_clicker::database::{Activity, BookAttr, Books, Library, Record};

use chrono::NaiveDate;
use dirs;
use serde::{Deserialize, Serialize};
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

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
        BookAttr::from(&isbn).await
    };
    println!("{:?}", attr);
    attr
}

#[tauri::command]
fn set_record(cfg: tauri::State<'_, ConfigManager>, book_attr: BookAttr, activity: Activity) {
    let rec = Record::from(book_attr, activity);
    let cfg = cfg.get();
    let lib_path = if cfg.debug {
        PathBuf::from("../lib.json")
    } else {
        cfg.dir_path.join("lib.json")
    };
    let lib = Library::load(&lib_path);
    println!("{:?}", rec);
    lib.add(rec);
    lib.save(&lib_path)
}

#[tauri::command]
fn debug_print(msg: &str) -> Result<(), String> {
    println!("{}", msg);
    Ok(())
}

#[tauri::command]
fn fetch_config(cfg: tauri::State<'_, ConfigManager>) -> Config {
    let mut config = cfg.fetch();
    config.dir_path = config.dir_path.join("lib.json");
    config
}

#[tauri::command]
fn set_config(cfg: tauri::State<'_, ConfigManager>, mut config: Config) {
    let dir_path: PathBuf = dirs::config_dir().unwrap().join(".bookie_clicker");
    let config_path = dir_path.join("config.json");
    config.dir_path = config.dir_path.parent().unwrap().to_path_buf();
    println!("{:?}", config);
    cfg.set(&config_path, config);
}

#[derive(Serialize, Deserialize)]
struct Term {
    start: NaiveDate,
    end: NaiveDate,
}

#[tauri::command]
fn fetch_record(cfg: tauri::State<'_, ConfigManager>, term: Term) -> Books {
    todo!()
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
            debug_print,
            set_config,
            fetch_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
