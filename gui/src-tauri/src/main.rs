// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bookie_clicker::gui::{Activity, BookAttr, Books, Record};
use std::{
    fs::{self, File},
    io::Write,
};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
async fn set_book_attr(cfg: tauri::State<'_, Config>, isbn: String) -> Result<BookAttr, String> {
    let debug = cfg.debug;

    println!("fetching isbn: {}", isbn);
    let attr = if debug {
        BookAttr::fake(&isbn)
    } else {
        BookAttr::from(&isbn).await
    };
    // println!("{:?}", attr);
    attr
}

#[tauri::command]
fn set_record(cfg: tauri::State<'_, Config>, book_attr: BookAttr, activity: Activity) {
    // println!("attr: {:?}\nactivity: {:?}\n", book_attr, activity);
    let lib = match fs::read_to_string(&cfg.file_path) {
        Ok(str) => str,
        Err(_) => String::new(),
    };
    let mut lib: Books = match serde_json::from_str(&lib) {
        Ok(lib) => lib,
        Err(_) => Books::new(),
    };
    let rec = Record::from(book_attr, activity);
    println!("rec: {:?}", rec);
    lib.add(rec);
    println!("lib: {:?}", lib);
    let lib: String = serde_json::to_string(&lib).unwrap();
    let mut file = File::create(&cfg.file_path).unwrap();
    file.write_all(lib.as_bytes()).unwrap();

    // dbを読み出す
    // 一致するattrを探す
    // activityをstatusに合成
    // dbに書き込み
}

#[tauri::command]
fn debug_print(msg: &str) -> Result<(), String> {
    println!("{}", msg);
    Ok(())
}

struct Config {
    debug: bool,
    file_path: String,
}

fn main() {
    let suteto = Config {
        debug: true,
        file_path: "../lib.json".into(),
    };
    tauri::Builder::default()
        .manage(suteto)
        .invoke_handler(tauri::generate_handler![
            set_book_attr,
            set_record,
            debug_print
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
