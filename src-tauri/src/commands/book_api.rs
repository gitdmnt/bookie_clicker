use crate::api::ndl_api;
use crate::db::Book;

#[tauri::command]
pub async fn search_book(isbn: String) -> Result<Vec<Book>, String> {
    ndl_api::search(&isbn)
        .await
        .map_err(|e| format!("NDL API error: {}", e))
}
