use tauri::async_runtime::block_on;
use tauri::{Builder, Manager};

mod db;
use db::Database;

mod timer;
use timer::TimerState;

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
            app.manage(TimerState::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![db::add, db::select, db::delete])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
