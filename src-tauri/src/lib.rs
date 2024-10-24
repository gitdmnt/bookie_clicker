// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod bookshelf;
mod config;

use bookshelf::{Activity, BookInfo, Bookshelf, Query};
use config::Config;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = Config::load();
    let bookshelf = Bookshelf::load(&config.bookshelf_path.lock().unwrap());

    tauri::Builder::default()
        .manage(bookshelf)
        .manage(config)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![add_record, get_config, set_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// レコードを追加する
#[tauri::command]
fn add_record(
    bookshelf: tauri::State<Bookshelf>,
    book_info: BookInfo,
    activity: Activity,
) -> String {
    let message = format!("Added: {}", book_info);
    bookshelf.add(book_info, activity);
    bookshelf.save();
    message
}

#[tauri::command]
fn show_record(bookshelf: tauri::State<Bookshelf>, query: Query) -> String {
    // 指定するもの: 読んだ期間、評価

    todo!()
}

// 設定を返す
#[tauri::command]
fn get_config() -> Config {
    Config::load()
}

// 設定をセットする
#[tauri::command]
fn set_config(
    c: tauri::State<Config>,
    bookshelf: tauri::State<Bookshelf>,
    config: Config,
) -> String {
    let result = c.set(&config);
    if let Err(e) = result {
        return e;
    };

    // パスが変わったのでリフレッシュ
    bookshelf.refresh(config.bookshelf_path.lock().unwrap().clone());
    result.unwrap()
}
