use tauri::State;

use crate::db::Database;
use crate::db::Element;
use crate::db::Query;

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

#[tauri::command]
pub async fn export_db(db: State<'_, Database>) -> Result<String, String> {
    db.export()
        .await
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}
