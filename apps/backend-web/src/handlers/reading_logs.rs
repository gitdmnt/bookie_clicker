use bookie_core::domain::ReadingLog;
use bookie_core::ports::{Filter, FilterValue, QueryBuilder};
use worker::*;

use crate::db::D1Database;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// POST /api/reading-logs - 読書ログを追加
pub async fn add_reading_log(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let log: ReadingLog = req.json().await?;
    
    let d1 = ctx.env.d1("DB")?;
    
    // user_idを追加して挿入
    let log_id = log.id.clone().unwrap_or_else(|| ulid::Ulid::new().to_string());
    
    let stmt = d1
        .prepare("INSERT INTO reading_logs (id, isbn, created_at, session_duration_sec, page_start, page_end, rating, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&[
            log_id.clone().into(),
            log.isbn.to_string().into(),
            log.created_at.into(),
            log.session_duration_sec.to_string().into(),
            log.page[0].to_string().into(),
            log.page[1].to_string().into(),
            log.rating.map(|r| r.to_string()).unwrap_or_default().into(),
            user.id.into(),
        ])
        .map_err(|e| Error::RustError(format!("Failed to bind parameters: {:?}", e)))?;

    stmt.run().await
        .map_err(|e| Error::RustError(format!("Failed to insert reading log: {:?}", e)))?;
    
    let id = log_id;
    
    #[derive(serde::Serialize)]
    struct AddResponse {
        id: String,
    }
    
    Response::from_json(&AddResponse { id })
}

/// GET /api/reading-logs?isbn=123&id=abc - 読書ログを検索
pub async fn select_reading_logs(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    
    let url = ctx.req.url()?;
    let params = url.query_pairs();
    
    let mut query = QueryBuilder::new()
        .filter(Filter::Eq("user_id".to_string(), FilterValue::String(user.id)));
    
    for (key, value) in params {
        match key.as_ref() {
            "isbn" => {
                if let Ok(isbn) = value.parse::<u64>() {
                    query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
                }
            }
            "id" => {
                query = query.filter(Filter::Eq("id".to_string(), FilterValue::String(value.to_string())));
            }
            _ => {}
        }
    }
    
    let d1 = ctx.env.d1("DB")?;
    let db = D1Database::new(d1);
    
    let logs = db.find_reading_logs(query)
        .await
        .map_err(handle_db_error)?;
    
    Response::from_json(&logs)
}

/// DELETE /api/reading-logs?id=abc - 読書ログを削除
pub async fn delete_reading_logs(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    
    let url = ctx.req.url()?;
    let params = url.query_pairs();
    
    let mut query = QueryBuilder::new()
        .filter(Filter::Eq("user_id".to_string(), FilterValue::String(user.id)));
    
    for (key, value) in params {
        if key == "id" {
            query = query.filter(Filter::Eq("id".to_string(), FilterValue::String(value.to_string())));
        }
    }
    
    let d1 = ctx.env.d1("DB")?;
    let db = D1Database::new(d1);
    
    db.delete_reading_logs(query)
        .await
        .map_err(handle_db_error)?;
    
    Response::ok("")
}
