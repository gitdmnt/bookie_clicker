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
            commands::db::add,
            commands::db::select,
            commands::db::delete,
            // timer commands
            commands::timer::timer_get,
            commands::timer::timer_start,
            commands::timer::timer_stop,
            commands::timer::timer_reset,
            commands::timer::timer_lap,
            commands::timer::timer_get_laps
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
