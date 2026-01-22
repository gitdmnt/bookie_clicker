use tauri::State;

use bookie_core::ports::{DatabasePort, Filter, FilterValue, QueryBuilder};
use crate::db::{Book, Database, Lap, ReadingLog};

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
    isbn: Option<u64>,
) -> Result<Vec<Book>, String> {
    let mut query = QueryBuilder::new();
    if let Some(isbn) = isbn {
        query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
    }
    
    DatabasePort::find_books(db.inner(), query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn select_reading_logs(
    db: State<'_, Database>,
    isbn: Option<u64>,
    id: Option<String>,
) -> Result<Vec<ReadingLog>, String> {
    let mut query = QueryBuilder::new();
    if let Some(isbn) = isbn {
        query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
    }
    if let Some(id) = id {
        query = query.filter(Filter::Eq("id".to_string(), FilterValue::String(id)));
    }
    
    DatabasePort::find_reading_logs(db.inner(), query)
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
pub async fn delete_books(db: State<'_, Database>, isbn: Option<u64>) -> Result<(), String> {
    let mut query = QueryBuilder::new();
    if let Some(isbn) = isbn {
        query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
    }
    
    DatabasePort::delete_books(db.inner(), query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_reading_logs(
    db: State<'_, Database>,
    id: Option<String>,
) -> Result<(), String> {
    let mut query = QueryBuilder::new();
    if let Some(id) = id {
        query = query.filter(Filter::Eq("id".to_string(), FilterValue::String(id)));
    }
    
    DatabasePort::delete_reading_logs(db.inner(), query)
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
