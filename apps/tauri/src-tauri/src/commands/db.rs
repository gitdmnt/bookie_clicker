use tauri::State;

use bookie_core::ports::DatabasePort;
use crate::db::{Book, Database, Lap, Query, ReadingLog};

#[tauri::command]
pub async fn add_book(db: State<'_, Database>, book: Book) -> Result<(), String> {
    DatabasePort::add_book(db.inner(), book)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_reading_log(
    db: State<'_, Database>,
    reading_log: ReadingLog,
) -> Result<String, String> {
    DatabasePort::add_reading_log(db.inner(), reading_log)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_laps(
    db: State<'_, Database>,
    reading_log: ReadingLog,
    laps: Vec<Lap>,
) -> Result<(), String> {
    DatabasePort::add_laps(db.inner(), reading_log, laps)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn select_books(
    db: State<'_, Database>,
    query: Query,
) -> Result<Vec<Book>, String> {
    db.select_books(query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn select_reading_logs(
    db: State<'_, Database>,
    query: Query,
) -> Result<Vec<ReadingLog>, String> {
    db.select_reading_logs(query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn select_laps(
    db: State<'_, Database>,
    reading_log: ReadingLog,
) -> Result<Vec<Lap>, String> {
    DatabasePort::find_laps(db.inner(), reading_log)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_books(db: State<'_, Database>, query: Query) -> Result<(), String> {
    db.delete_books(query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_reading_logs(
    db: State<'_, Database>,
    query: Query,
) -> Result<(), String> {
    db.delete_reading_logs(query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_lap(db: State<'_, Database>, id: String) -> Result<(), String> {
    DatabasePort::delete_lap(db.inner(), id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_db(db: State<'_, Database>) -> Result<String, String> {
    db.export()
        .await
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

// for debugging
#[tauri::command]
pub async fn query_raw(db: State<'_, Database>, query: String) -> Result<String, String> {
    db.query_raw(query)
        .await
        .map_err(|e| e.to_string())
}
