use tauri::State;

use crate::db::{Book, Database, Query, ReadingLog};

#[tauri::command]
pub async fn add_book(db: State<'_, Database>, book: Book) -> Result<(), surrealdb::Error> {
    db.add_book(book).await?;
    Ok(())
}

#[tauri::command]
pub async fn add_reading_log(
    db: State<'_, Database>,
    reading_log: ReadingLog,
) -> Result<(), surrealdb::Error> {
    db.add_reading_log(reading_log).await?;
    Ok(())
}

#[tauri::command]
pub async fn select_books(
    db: State<'_, Database>,
    query: Query,
) -> Result<Vec<Book>, surrealdb::Error> {
    db.select_books(query).await
}

#[tauri::command]
pub async fn select_reading_logs(
    db: State<'_, Database>,
    query: Query,
) -> Result<Vec<ReadingLog>, surrealdb::Error> {
    db.select_reading_logs(query).await
}

#[tauri::command]
pub async fn delete_books(db: State<'_, Database>, query: Query) -> Result<(), surrealdb::Error> {
    db.delete_books(query).await
}

#[tauri::command]
pub async fn delete_reading_logs(
    db: State<'_, Database>,
    query: Query,
) -> Result<(), surrealdb::Error> {
    db.delete_reading_logs(query).await
}

#[tauri::command]
pub async fn export_db(db: State<'_, Database>) -> Result<String, String> {
    db.export()
        .await
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}
