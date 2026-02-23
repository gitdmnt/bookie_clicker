use bookie_core::domain::Lap;
use worker::*;

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// POST /api/timer/sessions - タイマーセッションを開始（または既存の進行中セッションを返す）
pub async fn start_session(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&_req, &ctx).await?;
    let db = database_from_ctx(&ctx)?;

    let session = db
        .create_timer_session(&user.id)
        .await
        .map_err(handle_db_error)?;

    #[derive(serde::Serialize)]
    struct StartResponse {
        id: String,
        #[serde(rename = "startTime")]
        start_time: String,
        #[serde(rename = "isRunning")]
        is_running: bool,
    }

    Response::from_json(&StartResponse {
        id: session.id,
        start_time: session.start_time,
        is_running: session.stop_time.is_none(),
    })
}

/// PATCH /api/timer/sessions/:id/stop - タイマーセッションを停止
pub async fn stop_session(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let session_id = ctx
        .param("id")
        .ok_or_else(|| Error::RustError("Missing session id".to_string()))?;

    let db = database_from_ctx(&ctx)?;

    let session = db
        .stop_timer_session(session_id, &user.id)
        .await
        .map_err(handle_db_error)?;

    // Compute duration
    let duration_sec = compute_duration(&session.start_time, session.stop_time.as_deref());

    #[derive(serde::Serialize)]
    struct StopResponse {
        id: String,
        #[serde(rename = "startTime")]
        start_time: String,
        #[serde(rename = "stopTime")]
        stop_time: Option<String>,
        #[serde(rename = "durationSec")]
        duration_sec: i64,
        #[serde(rename = "isRunning")]
        is_running: bool,
    }

    Response::from_json(&StopResponse {
        id: session.id,
        start_time: session.start_time,
        stop_time: session.stop_time.clone(),
        duration_sec,
        is_running: false,
    })
}

/// PATCH /api/timer/sessions/:id/resume - 停止中のタイマーセッションを再開
pub async fn resume_session(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let session_id = ctx
        .param("id")
        .ok_or_else(|| Error::RustError("Missing session id".to_string()))?;

    let db = database_from_ctx(&ctx)?;

    let session = db
        .resume_timer_session(session_id, &user.id)
        .await
        .map_err(handle_db_error)?;

    #[derive(serde::Serialize)]
    struct ResumeResponse {
        id: String,
        #[serde(rename = "startTime")]
        start_time: String,
        #[serde(rename = "isRunning")]
        is_running: bool,
    }

    Response::from_json(&ResumeResponse {
        id: session.id,
        start_time: session.start_time,
        is_running: true,
    })
}

/// GET /api/timer/sessions/current - 現在の未保存セッションを取得
pub async fn get_current_session(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let db = database_from_ctx(&ctx)?;

    let session = db
        .get_current_timer_session(&user.id)
        .await
        .map_err(handle_db_error)?;

    match session {
        Some(s) => {
            let duration_sec = compute_duration(&s.start_time, s.stop_time.as_deref());

            #[derive(serde::Serialize)]
            struct SessionResponse {
                id: String,
                #[serde(rename = "startTime")]
                start_time: String,
                #[serde(rename = "stopTime")]
                stop_time: Option<String>,
                #[serde(rename = "durationSec")]
                duration_sec: i64,
                #[serde(rename = "isRunning")]
                is_running: bool,
            }

            Response::from_json(&SessionResponse {
                id: s.id,
                start_time: s.start_time,
                stop_time: s.stop_time.clone(),
                duration_sec,
                is_running: s.stop_time.is_none(),
            })
        }
        None => Response::from_json(&serde_json::Value::Null),
    }
}

/// POST /api/timer/sessions/:id/save - セッションを保存（reading_log + laps 作成）
pub async fn save_session(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let session_id = ctx
        .param("id")
        .ok_or_else(|| Error::RustError("Missing session id".to_string()))?;

    #[derive(serde::Deserialize)]
    struct SaveRequest {
        isbn: u64,
        #[serde(rename = "firstPage")]
        first_page: u16,
        #[serde(rename = "lastPage")]
        last_page: u16,
        rating: Option<u8>,
        laps: Vec<LapInput>,
    }

    #[derive(serde::Deserialize)]
    struct LapInput {
        #[serde(rename = "elapsedMs")]
        elapsed_ms: u64,
        note: String,
        #[serde(rename = "refPage")]
        ref_page: u32,
    }

    let save_req: SaveRequest = req.json().await?;

    // Convert LapInput to domain Lap
    let now = chrono::Utc::now().to_rfc3339();
    let laps: Vec<Lap> = save_req
        .laps
        .into_iter()
        .map(|l| Lap {
            id: None,
            elapsed_ms: l.elapsed_ms,
            note: Some(l.note),
            ref_page: Some(l.ref_page),
            created_at: now.clone(),
        })
        .collect();

    let db = database_from_ctx(&ctx)?;

    let (log_id, server_duration_sec) = db
        .save_timer_session(
            session_id,
            &user.id,
            save_req.isbn,
            save_req.first_page,
            save_req.last_page,
            save_req.rating,
            laps,
        )
        .await
        .map_err(handle_db_error)?;

    #[derive(serde::Serialize)]
    struct SaveResponse {
        #[serde(rename = "readingLogId")]
        reading_log_id: String,
        #[serde(rename = "sessionDurationSec")]
        session_duration_sec: u64,
    }

    Response::from_json(&SaveResponse {
        reading_log_id: log_id,
        session_duration_sec: server_duration_sec,
    })
}

/// DELETE /api/timer/sessions - 未保存セッションをリセット（削除）
pub async fn reset_session(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let db = database_from_ctx(&ctx)?;

    db.reset_timer_session(&user.id)
        .await
        .map_err(handle_db_error)?;

    Response::ok("")
}

// Helper: compute duration in seconds from start_time to stop_time (or now)
fn compute_duration(start_time: &str, stop_time: Option<&str>) -> i64 {
    let start = chrono::DateTime::parse_from_rfc3339(start_time).ok();
    let end = stop_time
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .or_else(|| Some(chrono::Utc::now().into()));

    match (start, end) {
        (Some(s), Some(e)) => (e.signed_duration_since(s)).num_seconds().max(0),
        _ => 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn duration_with_stop_time() {
        let start = "2026-02-23T10:00:00+00:00";
        let stop = "2026-02-23T10:45:00+00:00";
        assert_eq!(compute_duration(start, Some(stop)), 2700); // 45 min
    }

    #[test]
    fn duration_one_hour() {
        let start = "2026-02-23T10:00:00+00:00";
        let stop = "2026-02-23T11:00:00+00:00";
        assert_eq!(compute_duration(start, Some(stop)), 3600);
    }

    #[test]
    fn duration_same_time_is_zero() {
        let t = "2026-02-23T10:00:00+00:00";
        assert_eq!(compute_duration(t, Some(t)), 0);
    }

    #[test]
    fn duration_negative_clamped_to_zero() {
        // stop is before start — should clamp to 0
        let start = "2026-02-23T11:00:00+00:00";
        let stop = "2026-02-23T10:00:00+00:00";
        assert_eq!(compute_duration(start, Some(stop)), 0);
    }

    #[test]
    fn duration_without_stop_time_uses_now() {
        let start = "2020-01-01T00:00:00+00:00";
        let result = compute_duration(start, None);
        // Should be > 0 since start is in the past
        assert!(result > 0);
    }

    #[test]
    fn duration_invalid_start_returns_zero() {
        let result = compute_duration("not-a-date", Some("2026-02-23T10:00:00+00:00"));
        assert_eq!(result, 0);
    }

    #[test]
    fn duration_invalid_stop_falls_back_to_now() {
        let start = "2020-01-01T00:00:00+00:00";
        let result = compute_duration(start, Some("not-a-date"));
        // invalid stop is skipped, falls back to now
        assert!(result > 0);
    }

    #[test]
    fn duration_with_different_timezones() {
        let start = "2026-02-23T10:00:00+09:00"; // JST
        let stop = "2026-02-23T02:00:00+00:00";  // UTC (same instant as 11:00 JST)
        assert_eq!(compute_duration(start, Some(stop)), 3600); // 1 hour
    }
}
