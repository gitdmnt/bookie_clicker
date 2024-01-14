// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bookie_clicker::config::ConfigManager;
use bookie_clicker::data_struct::{Activity, BookAttr, Books, Record};
use chrono::NaiveDate;
use dirs;
use serde::{Deserialize, Serialize};
use std::{fs, io::Write, path::PathBuf};
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
    let mut lib = Books::load(&lib_path);

    lib.add(rec);
    let lib: String = serde_json::to_string(&lib).unwrap();
    let mut file = fs::File::create(&lib_path).unwrap();
    file.write_all(lib.as_bytes()).unwrap();
}

#[tauri::command]
fn debug_print(msg: &str) -> Result<(), String> {
    println!("{}", msg);
    Ok(())
}

#[tauri::command]
fn reload_config(cfg: tauri::State<'_, ConfigManager>) {
    let dir_path: PathBuf = dirs::config_dir().unwrap().join(".bookie_clicker");
    let config_path = dir_path.join("config.json");
    let state = ConfigManager::load(&config_path);
    cfg.edit(state);
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
    let state = ConfigManager::load(&config_path);
    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            set_book_attr,
            set_record,
            debug_print,
            reload_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
