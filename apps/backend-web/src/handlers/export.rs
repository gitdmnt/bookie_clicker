use worker::*;
use bookie_core::ports::{Filter, FilterValue, QueryBuilder};
use bookie_core::DatabasePort;

use crate::db::D1Database;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// GET /api/export - データベース全体をエクスポート
pub async fn export_database(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let d1 = ctx.env.d1("DB")?;
    let db = D1Database::new(d1);
    
    // ユーザースコープでエクスポート
    let books_query = QueryBuilder::new()
        .filter(Filter::Eq("user_id".to_string(), FilterValue::String(user.id.clone())));
    let logs_query = QueryBuilder::new()
        .filter(Filter::Eq("user_id".to_string(), FilterValue::String(user.id)));
    
    let books = db.find_books(books_query)
        .await
        .map_err(handle_db_error)?;
    let logs = db.find_reading_logs(logs_query)
        .await
        .map_err(handle_db_error)?;
    
    #[derive(serde::Serialize)]
    struct ExportResponse {
        books: Vec<bookie_core::domain::Book>,
        #[serde(rename = "readingLogs")]
        reading_logs: Vec<bookie_core::domain::ReadingLog>,
    }
    
    let export = ExportResponse {
        books,
        reading_logs: logs,
    };
    
    let json = serde_json::to_string(&export)
        .map_err(|e| worker::Error::RustError(format!("Failed to serialize export: {}", e)))?;
    
    #[derive(serde::Serialize)]
    struct DataWrapper {
        data: String,
    }
    
    Response::from_json(&DataWrapper { data: json })
}
