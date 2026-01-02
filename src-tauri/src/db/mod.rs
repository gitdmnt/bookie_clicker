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

#[tauri::command]
pub async fn add(db: State<'_, Database>, e: Element) -> Result<(), surrealdb::Error> {
    db.add(e).await?;
    Ok(())
}

#[tauri::command]
pub async fn select(
    db: State<'_, Database>,
    query: Query,
) -> Result<Vec<Element>, surrealdb::Error> {
    db.select(query).await
}

#[tauri::command]
pub async fn delete(db: State<'_, Database>, query: Query) -> Result<(), surrealdb::Error> {
    db.delete(query).await
}
