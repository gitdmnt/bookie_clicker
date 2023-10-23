// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bookie_clicker::{
    cli::{BookAttr, BookLib},
    config::{Config, Mode},
};
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn main_cli(cfg: Config) -> Result<(), String> {
    let mut buf = BookLib::new();

    // データ入力
    loop {
        let mut book_details = if cfg.debug {
            match BookAttr::debug_book_attr() {
                Ok(attr) => attr,
                Err(e) => {
                    println!("{}", e);
                    break;
                }
            }
        } else {
            match BookAttr::fetch_book_attr().await {
                Ok(attr) => attr,
                Err(e) => {
                    println!("{}", e);
                    break;
                }
            }
        };
        book_details.print_attr();
        match book_details.set_status() {
            Ok(_) => (),
            Err(e) => {
                println!("{}", e);
                break;
            }
        };

        buf.push(book_details);
    }
    if let Err(e) = buf.write(&cfg) {
        println!("{}", e);
    };
    Ok(())
}
