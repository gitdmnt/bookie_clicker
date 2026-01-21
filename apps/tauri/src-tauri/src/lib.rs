use tauri::async_runtime::block_on;
use tauri::{Builder, Manager};

mod commands;
mod timer;

mod db;
use db::Database;
use timer::TimerManager;

mod api;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = block_on(async {
        Database::connect("bookie_clicker".to_string())
            .await
            .unwrap()
    });

    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            app.manage(db);
            // Manage TimerManager (in-memory timer)
            app.manage(TimerManager::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::db::add_book,
            commands::db::add_reading_log,
            commands::db::add_laps,
            commands::db::select_books,
            commands::db::select_reading_logs,
            commands::db::select_laps,
            commands::db::delete_books,
            commands::db::delete_reading_logs,
            commands::db::delete_lap,
            commands::db::export_db,
            commands::db::query_raw, // for debugging
            // timer commands
            commands::timer::timer_get,
            commands::timer::timer_start,
            commands::timer::timer_stop,
            commands::timer::timer_reset,
            commands::timer::timer_lap,
            commands::timer::timer_get_laps,
            // book API commands
            commands::book_api::search_book,
            commands::book_api::parse_isbn,
            // barcode commands
            commands::barcode::scan_barcode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
