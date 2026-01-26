use async_trait::async_trait;
use bookie_core::application::book_search::search_book_by_isbn;
use bookie_core::domain::{Book, Isbn};
use bookie_core::ports::{Filter, FilterValue, HttpClient, QueryBuilder};
use chrono::Utc;
use worker::*;

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

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
    let params = url.query_pairs();

    let mut query = QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user.id),
    ));

    for (key, value) in params {
        if key == "isbn" {
            if let Ok(isbn) = Isbn::parse(&value) {
                query = query.filter(Filter::Eq(
                    "isbn".to_string(),
                    FilterValue::U64(isbn.value()),
                ));
            }
        }
    }

    let db = database_from_ctx(&ctx)?;

    let books = db.find_books(query).await.map_err(handle_db_error)?;

    Response::from_json(&books)
}

/// DELETE /api/books?isbn=123 - 書籍を削除
pub async fn delete_books(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;

    let url = req.url()?;
    let params = url.query_pairs();

    let mut query = QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user.id),
    ));

    for (key, value) in params {
        if key == "isbn" {
            if let Ok(isbn) = Isbn::parse(&value) {
                query = query.filter(Filter::Eq(
                    "isbn".to_string(),
                    FilterValue::U64(isbn.value()),
                ));
            }
        }
    }

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
