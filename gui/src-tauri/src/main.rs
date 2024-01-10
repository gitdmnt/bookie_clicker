// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bookie_clicker::gui::{Activity, BookAttr};

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
fn set_record(suteto: tauri::State<KouiuState>, book_attr: BookAttr, activity: Activity) {
    println!("attr: {:?}\nactivity: {:?}", book_attr, activity);
    println!("jsonをもらうのよ{:?}", suteto.waaa);
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

struct KouiuState {
    waaa: String,
}

fn main() {
    let suteto = KouiuState {
        waaa: "pien".to_owned(),
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