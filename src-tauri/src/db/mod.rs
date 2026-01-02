/// Database module handling SurrealDB operations including Tauri commands for frontend interaction.
mod database;
pub use database::Database;

mod book;
mod element;
mod query;
mod readinglog;
mod table;

use tauri::State;

use crate::db::element::Element;
use crate::db::query::Query;

/// Tauri command to add an element (Book or ReadingLog) to the database.
#[tauri::command]
pub async fn add(db: State<'_, Database>, e: Element) -> Result<(), surrealdb::Error> {
    db.add(e).await?;
    Ok(())
}

/// Tauri command to select elements from the database based on a query.
#[tauri::command]
pub async fn select(
    db: State<'_, Database>,
    query: Query,
) -> Result<Vec<Element>, surrealdb::Error> {
    db.select(query).await
}

/// Tauri command to delete elements from the database based on a query.
#[tauri::command]
pub async fn delete(db: State<'_, Database>, query: Query) -> Result<(), surrealdb::Error> {
    db.delete(query).await
}
