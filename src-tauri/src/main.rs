// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bookie_clicker::gui::{Activity, BookAttr, Books, Record};
use dirs;
use serde::{Deserialize, Serialize};
use std::{fs, io::Write, path::PathBuf};
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
    let lib_path = cfg.dir_path.join("lib.json");
    let lib = match fs::read_to_string(&lib_path) {
        Ok(str) => str,
        Err(_) => {
            fs::create_dir_all(&cfg.dir_path).unwrap_or_else(|why| {
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

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    debug: bool,
    dir_path: PathBuf,
}

impl Config {
    pub fn new() -> Config {
        Config {
            debug: false,
            dir_path: dirs::config_dir().unwrap().join(".bookie_clicker"),
        }
    }
}

fn main() {
    let dir_path: PathBuf = dirs::config_dir().unwrap().join(".bookie_clicker");
    let config_path = dir_path.join("config.json");

    let state = match fs::read_to_string(&config_path) {
        Ok(str) => {
            let config: Config = match serde_json::from_str(&str) {
                Ok(config) => config,
                Err(_) => {
                    let mut file = fs::File::create(&config_path).unwrap();
                    let default_config = Config::new();
                    let json: String = serde_json::to_string(&default_config).unwrap();
                    file.write_all(json.as_bytes()).unwrap();
                    default_config
                }
            };
            config
        }
        Err(_) => {
            // dirを作る
            fs::create_dir_all(dir_path).unwrap_or_else(|why| {
                println!("! {:?}", why.kind());
            });
            // configファイルを作ってデフォルトをセットする
            let mut file = fs::File::create(&config_path).unwrap();
            let default_config = Config::new();
            let json: String = serde_json::to_string(&default_config).unwrap();
            file.write_all(json.as_bytes()).unwrap();
            default_config
        }
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            set_book_attr,
            set_record,
            debug_print
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
