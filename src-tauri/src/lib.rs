use std::sync::Mutex;

use tauri::async_runtime::block_on;
use tauri::{Builder, Manager, State};

mod db;
use db::{Database, Element, Query};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn add(db: State<'_, Database>, e: Element) -> Result<(), surrealdb::Error> {
    db.add(e).await?;
    Ok(())
}

#[tauri::command]
async fn query(db: State<'_, Database>, query: Query) -> Result<Vec<Element>, surrealdb::Error> {
    db.query(query).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = block_on(async {
        Database::connect("bookie_clicker".to_string())
            .await
            .unwrap()
    });

    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(Mutex::new(db));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![add, query])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
