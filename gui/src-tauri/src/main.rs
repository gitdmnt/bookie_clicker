// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bookie_clicker::gui::BookAttr;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
async fn set_book_attr(isbn: &str) -> Result<BookAttr, String> {
    let debug = true;
    println!("fetching isbn: {}", isbn);
    let attr = if debug {
        BookAttr::fake()
    } else {
        BookAttr::from(isbn).await
    };
    println!("{:?}", attr);
    attr
}

#[tauri::command]
fn debug_print(msg: &str) -> Result<(), String> {
    println!("{}", msg);
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_book_attr, debug_print])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
