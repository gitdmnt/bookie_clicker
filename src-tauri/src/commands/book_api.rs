use crate::db::Book;

#[tauri::command]
async fn search_book_by_NDL(isbn: String) -> Result<Vec<Book>, String> {
    unimplemented!()
}
