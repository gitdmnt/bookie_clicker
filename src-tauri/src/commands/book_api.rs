use crate::api::isbn;
use crate::api::ndl;
use crate::db::Book;

#[tauri::command]
pub async fn search_book(isbn: String) -> Result<Vec<Book>, String> {
    ndl::search(&isbn)
        .await
        .map_err(|e| format!("NDL API error: {}", e))
}

#[tauri::command]
pub fn parse_isbn(input: String) -> Result<u64, String> {
    isbn::parse_isbn(&input)
}
