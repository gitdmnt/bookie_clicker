use bookie_core::domain::{Lap, ReadingLog};
use worker::*;

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// POST /api/laps - ラップを追加（バッチ）
pub async fn add_laps(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    #[derive(serde::Deserialize)]
    struct AddLapsRequest {
        #[serde(rename = "readingLog")]
        reading_log: ReadingLog,
        laps: Vec<Lap>,
    }
    
    let add_req: AddLapsRequest = req.json().await?;
    
    let db = database_from_ctx(&ctx)?;
    
    db.add_laps_with_user(add_req.reading_log, add_req.laps, &user.id)
        .await
        .map_err(handle_db_error)?;
    
    Response::ok("")
}

/// GET /api/laps?reading_log_id=abc - ラップを検索
pub async fn select_laps(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    require_auth(&req, &ctx).await?;
    let url = req.url()?;
    let params = url.query_pairs();
    
    let mut reading_log_id = None;
    
    for (key, value) in params {
        if key == "reading_log_id" {
            reading_log_id = Some(value.to_string());
        }
    }
    
    let log_id = reading_log_id
        .ok_or_else(|| worker::Error::RustError("Missing reading_log_id parameter".to_string()))?;
    
    let reading_log = ReadingLog {
        id: Some(log_id),
        isbn: 0, // Dummy value, only ID is used
        created_at: String::new(),
        session_duration_sec: 0,
        page: [0, 0],
        rating: None,
    };
    
    let db = database_from_ctx(&ctx)?;
    
    let laps = db.find_laps(reading_log)
        .await
        .map_err(handle_db_error)?;
    
    Response::from_json(&laps)
}

/// DELETE /api/laps/:id - ラップを削除
pub async fn delete_lap(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    require_auth(&req, &ctx).await?;
    let id = ctx.param("id")
        .ok_or_else(|| worker::Error::RustError("Missing id parameter".to_string()))?;
    
    let db = database_from_ctx(&ctx)?;
    
    db.delete_lap(id.to_string())
        .await
        .map_err(handle_db_error)?;
    
    Response::ok("")
}
