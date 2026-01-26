use bookie_core::domain::ReadingLog;
use bookie_core::ports::{Filter, FilterValue, QueryBuilder};
use worker::*;

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// POST /api/reading-logs - 読書ログを追加
pub async fn add_reading_log(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let log: ReadingLog = req.json().await?;

    let db = database_from_ctx(&ctx)?;

    let id = db
        .add_reading_log_with_user(log, &user.id)
        .await
        .map_err(handle_db_error)?;

    #[derive(serde::Serialize)]
    struct AddResponse {
        id: String,
    }

    Response::from_json(&AddResponse { id })
}

/// GET /api/reading-logs?isbn=123&id=abc - 読書ログを検索
pub async fn select_reading_logs(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;

    let url = req.url()?;
    let params = url.query_pairs();

    let mut query = QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user.id),
    ));

    for (key, value) in params {
        match key.as_ref() {
            "isbn" => {
                if let Ok(isbn) = value.parse::<u64>() {
                    query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
                }
            }
            "id" => {
                query = query.filter(Filter::Eq(
                    "id".to_string(),
                    FilterValue::String(value.to_string()),
                ));
            }
            _ => {}
        }
    }

    let db = database_from_ctx(&ctx)?;

    let logs = db.find_reading_logs(query).await.map_err(handle_db_error)?;

    Response::from_json(&logs)
}

/// DELETE /api/reading-logs?id=abc - 読書ログを削除
pub async fn delete_reading_logs(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;

    let url = req.url()?;
    let params = url.query_pairs();

    let mut query = QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user.id),
    ));

    for (key, value) in params {
        if key == "id" {
            query = query.filter(Filter::Eq(
                "id".to_string(),
                FilterValue::String(value.to_string()),
            ));
        }
    }

    let db = database_from_ctx(&ctx)?;

    db.delete_reading_logs(query)
        .await
        .map_err(handle_db_error)?;

    Response::ok("")
}
