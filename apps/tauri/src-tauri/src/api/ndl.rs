use bookie_core::application::book_search::search_book_by_isbn;
use bookie_core::Book;

use crate::adapters::clock::SystemClock;
use crate::adapters::http::ReqwestClient;

/// Thin facade for NDL API search using infrastructure adapters
pub async fn search(isbn: &str) -> Result<Vec<Book>, String> {
    let client = ReqwestClient::new();
    let clock = SystemClock;
    search_book_by_isbn(isbn, &client, &clock).await
}
