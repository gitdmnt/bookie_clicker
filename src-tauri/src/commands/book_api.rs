use crate::api::ndl;
use crate::db::Book;

#[tauri::command]
pub async fn search_book(isbn: String) -> Result<Vec<Book>, String> {
    ndl::search(&isbn)
        .await
        .map_err(|e| format!("NDL API error: {}", e))
}
