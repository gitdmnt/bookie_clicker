// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bookie_clicker::config::ConfigManager;
use bookie_clicker::gui::{Activity, BookAttr, Books, Record};
use dirs;
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
    // println!("{:?}", attr);
    attr
}

#[tauri::command]
fn set_record<'a>(cfg: tauri::State<'_, ConfigManager>, book_attr: BookAttr, activity: Activity) {
    // println!("attr: {:?}\nactivity: {:?}\n", book_attr, activity);
    let cfg = cfg.get();
    let path = PathBuf::from("../");
    let dir_path: &PathBuf = if cfg.debug { &path } else { &cfg.dir_path };
    let lib_path = dir_path.join("lib.json");
    let lib = match fs::read_to_string(&lib_path) {
        Ok(str) => str,
        Err(_) => {
            fs::create_dir_all(dir_path).unwrap_or_else(|why| {
                println!("! {:?}", why.kind());
            });
            fs::File::create(&lib_path).unwrap();

            String::new()
        }
    };
    let mut lib: Books = match serde_json::from_str(&lib) {
        Ok(lib) => lib,
        Err(_) => Books::new(),
    };
    let rec = Record::from(book_attr, activity);
    // println!("rec: {:?}", rec);
    lib.add(rec);
    // println!("lib: {:?}", lib);
    let lib: String = serde_json::to_string(&lib).unwrap();
    // println!("{:?}", lib_path);
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
    println!("{:?}", state);
    cfg.edit(state);
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
