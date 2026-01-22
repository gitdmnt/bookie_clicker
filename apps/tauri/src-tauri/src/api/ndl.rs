use bookie_core::api::ndl::search_with_client;
use bookie_core::Book;

use crate::adapters::clock::SystemClock;
use crate::adapters::http::ReqwestClient;

/// Thin facade for NDL API search using infrastructure adapters
pub async fn search(isbn: &str) -> Result<Vec<Book>, String> {
    let client = ReqwestClient::new();
    let clock = SystemClock;
    search_with_client(isbn, &client, &clock).await
}
