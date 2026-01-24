use bookie_core::domain::{Book, Isbn};
use bookie_core::ports::{Filter, FilterValue, QueryBuilder};
use worker::*;

use crate::db::D1Database;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// POST /api/books - 書籍を追加
pub async fn add_book(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    
    let mut book: Book = req.json().await?;
    
    let d1 = ctx.env.d1("DB")?;
    
    // user_idを追加するためにD1に直接挿入
    let authors_json = serde_json::to_string(&book.authors)
        .map_err(|e| Error::RustError(format!("Failed to serialize authors: {}", e)))?;
    
    let stmt = d1
        .prepare("INSERT INTO books (isbn, title, series_title, authors, publisher, year, page_count, image_url, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&[
            book.isbn.to_string().into(),
            book.title.into(),
            book.series_title.unwrap_or_default().into(),
            authors_json.into(),
            book.publisher.into(),
            book.year.to_string().into(),
            book.page_count.to_string().into(),
            book.image_url.into(),
            book.created_at.into(),
            user.id.into(),
        ])
        .map_err(|e| Error::RustError(format!("Failed to bind parameters: {:?}", e)))?;

    stmt.run().await.map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            Error::RustError(format!("Book with ISBN {} already exists", book.isbn))
        } else {
            Error::RustError(format!("Failed to insert book: {:?}", e))
        }
    })?;
    
    Response::ok("")
}

/// GET /api/books?isbn=123 - 書籍を検索
pub async fn select_books(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    
    let url = ctx.req.url()?;
    let params = url.query_pairs();
    
    let mut query = QueryBuilder::new()
        .filter(Filter::Eq("user_id".to_string(), FilterValue::String(user.id)));
    
    for (key, value) in params {
        if key == "isbn" {
            if let Ok(isbn) = value.parse::<u64>() {
                query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
            }
        }
    }
    
    let d1 = ctx.env.d1("DB")?;
    let db = D1Database::new(d1);
    
    let books = db.find_books(query)
        .await
        .map_err(handle_db_error)?;
    
    Response::from_json(&books)
}

/// DELETE /api/books?isbn=123 - 書籍を削除
pub async fn delete_books(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    
    let url = ctx.req.url()?;
    let params = url.query_pairs();
    
    let mut query = QueryBuilder::new()
        .filter(Filter::Eq("user_id".to_string(), FilterValue::String(user.id)));
    
    for (key, value) in params {
        if key == "isbn" {
            if let Ok(isbn) = value.parse::<u64>() {
                query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
            }
        }
    }
    
    let d1 = ctx.env.d1("DB")?;
    let db = D1Database::new(d1);
    
    db.delete_books(query)
        .await
        .map_err(handle_db_error)?;
    
    Response::ok("")
}

/// POST /api/books/search - NDL APIで書籍検索
pub async fn search_books(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    #[derive(serde::Deserialize)]
    struct SearchRequest {
        isbn: String,
    }
    
    let search_req: SearchRequest = req.json().await?;
    
    // TODO: NDL API実装 (HttpClientとClockアダプターが必要)
    // 現時点ではプレースホルダー
    Response::error("NDL API search not yet implemented", 501)
}

/// POST /api/isbn/parse - ISBN文字列をパース
pub async fn parse_isbn(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    #[derive(serde::Deserialize)]
    struct ParseRequest {
        input: String,
    }
    
    #[derive(serde::Serialize)]
    struct ParseResponse {
        isbn: u64,
    }
    
    let parse_req: ParseRequest = req.json().await?;
    
    match Isbn::parse(&parse_req.input) {
        Ok(isbn) => Response::from_json(&ParseResponse { isbn: isbn.value() }),
        Err(e) => Response::error(e, 400),
    }
}
