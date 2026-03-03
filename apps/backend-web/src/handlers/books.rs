use async_trait::async_trait;
use bookie_core::application::book_search::search_book_by_isbn;
use bookie_core::domain::{Book, Isbn};
use bookie_core::ports::{Filter, FilterValue, HttpClient, QueryBuilder};
use chrono::Utc;
use worker::*;

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// URLクエリパラメータからISBNフィルタ付きのQueryBuilderを構築する純粋関数
fn build_isbn_filter(user_id: String, query_pairs: Vec<(String, String)>) -> QueryBuilder {
    let mut query = QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user_id),
    ));

    for (key, value) in query_pairs {
        if key == "isbn" {
            if let Ok(isbn) = Isbn::parse(&value) {
                query = query.filter(Filter::Eq(
                    "isbn".to_string(),
                    FilterValue::U64(isbn.value()),
                ));
            }
        }
    }

    query
}

/// POST /api/books - 書籍を追加
pub async fn add_book(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;

    let book: Book = req.json().await?;

    dbg!(format!("add_book request body: isbn = {}", book.isbn));

    let db = database_from_ctx(&ctx)?;
    db.add_book_with_user(book, &user.id)
        .await
        .map_err(handle_db_error)?;

    Response::empty()
}

/// GET /api/books?isbn=123 - 書籍を検索
pub async fn select_books(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;

    let url = req.url()?;
    let query_pairs: Vec<(String, String)> = url
        .query_pairs()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let query = build_isbn_filter(user.id, query_pairs);

    let db = database_from_ctx(&ctx)?;
    let books = db.find_books(query).await.map_err(handle_db_error)?;

    Response::from_json(&books)
}

/// DELETE /api/books?isbn=123 - 書籍を削除
pub async fn delete_books(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;

    let url = req.url()?;
    let query_pairs: Vec<(String, String)> = url
        .query_pairs()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let query = build_isbn_filter(user.id, query_pairs);

    let db = database_from_ctx(&ctx)?;
    db.delete_books(query).await.map_err(handle_db_error)?;

    Response::empty()
}

/// POST /api/books/search - NDL APIで書籍検索
pub async fn search_books(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    #[derive(serde::Deserialize)]
    struct SearchRequest {
        isbn: String,
    }

    let search_req: SearchRequest = req.json().await?;

    // 1. ISBNバリデーション（package/core）
    let isbn = Isbn::parse(&search_req.isbn)
        .map_err(|e| Error::RustError(format!("Invalid ISBN: {}", e)))?;

    // 2. NDL API検索（package/coreのアプリケーションサービス）
    let client = WorkerHttpClient;
    let mut books = search_book_by_isbn(&isbn.value().to_string(), &client)
        .await
        .map_err(|e| Error::RustError(format!("NDL API error: {}", e)))?;
    let now = Utc::now().to_rfc3339();
    for book in books.iter_mut() {
        if book.created_at.is_none() {
            book.created_at = Some(now.clone());
        }
    }

    // upsert into shared master
    let db = database_from_ctx(&_ctx)?;
    for book in books.iter() {
        db.upsert_books_master(book)
            .await
            .map_err(|e| Error::RustError(format!("Failed to upsert master book: {:?}", e)))?;
    }

    Response::from_json(&books)
}

// ============================================================
// NDL API Adapters (Worker)
// ============================================================

struct WorkerHttpClient;
#[cfg(not(target_arch = "wasm32"))]
#[async_trait]
impl HttpClient for WorkerHttpClient {
    async fn get_text(&self, _url: &str) -> Result<String, String> {
        Err("WorkerHttpClient is only available on wasm32".to_string())
    }
}

#[cfg(target_arch = "wasm32")]
#[async_trait(?Send)]
impl HttpClient for WorkerHttpClient {
    async fn get_text(&self, url: &str) -> Result<String, String> {
        let mut init = RequestInit::new();
        init.method = Method::Get;

        let req = Request::new_with_init(url, &init).map_err(|e| e.to_string())?;
        let mut resp = Fetch::Request(req)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !(200..300).contains(&resp.status_code()) {
            return Err(format!("NDL API request failed: {}", resp.status_code()));
        }

        resp.text().await.map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // build_isbn_filter のユニットテスト
    // ========================================

    #[test]
    fn isbn_filter_no_params() {
        let query = build_isbn_filter("user1".to_string(), vec![]);
        assert_eq!(query.filters.len(), 1);
        assert_eq!(
            query.filters[0],
            Filter::Eq(
                "user_id".to_string(),
                FilterValue::String("user1".to_string())
            )
        );
    }

    #[test]
    fn isbn_filter_with_valid_isbn13() {
        let pairs = vec![("isbn".to_string(), "9784003101018".to_string())];
        let query = build_isbn_filter("user1".to_string(), pairs);
        assert_eq!(query.filters.len(), 2);
        // 最初のフィルタは user_id
        assert_eq!(
            query.filters[0],
            Filter::Eq(
                "user_id".to_string(),
                FilterValue::String("user1".to_string())
            )
        );
        // 2つ目のフィルタは isbn
        if let Filter::Eq(field, FilterValue::U64(_)) = &query.filters[1] {
            assert_eq!(field, "isbn");
        } else {
            panic!("Expected isbn filter with U64 value");
        }
    }

    #[test]
    fn isbn_filter_with_invalid_isbn() {
        let pairs = vec![("isbn".to_string(), "invalid".to_string())];
        let query = build_isbn_filter("user1".to_string(), pairs);
        // 無効なISBNは無視されるので user_id フィルタのみ
        assert_eq!(query.filters.len(), 1);
    }

    #[test]
    fn isbn_filter_ignores_non_isbn_params() {
        let pairs = vec![
            ("page".to_string(), "1".to_string()),
            ("limit".to_string(), "10".to_string()),
        ];
        let query = build_isbn_filter("user1".to_string(), pairs);
        assert_eq!(query.filters.len(), 1);
    }

    #[test]
    fn isbn_filter_multiple_isbn_params() {
        // 複数ISBNが指定された場合、全て追加される
        let pairs = vec![
            ("isbn".to_string(), "9784003101018".to_string()),
            ("isbn".to_string(), "9780000000002".to_string()),
        ];
        let query = build_isbn_filter("user1".to_string(), pairs);
        // user_id + 有効なISBN分のフィルタ
        assert!(query.filters.len() >= 2);
    }
}
