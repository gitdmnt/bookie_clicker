use bookie_core::domain::{Lap, ReadingLog};
use worker::*;

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// URLクエリパラメータからreading_log_idを抽出する純粋関数
fn extract_reading_log_id(query_pairs: Vec<(String, String)>) -> Option<String> {
    query_pairs
        .into_iter()
        .find(|(key, _)| key == "reading_log_id")
        .map(|(_, value)| value)
}

/// ラップ検索用のダミーReadingLogを構築する純粋関数
/// ラップ検索にはReadingLogのIDのみが必要
fn build_reading_log_for_laps(log_id: String) -> ReadingLog {
    ReadingLog {
        id: Some(log_id),
        isbn: 0,
        created_at: String::new(),
        session_duration_sec: 0,
        page: [0, 0],
        rating: None,
    }
}

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
    let query_pairs: Vec<(String, String)> = url
        .query_pairs()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let log_id = extract_reading_log_id(query_pairs)
        .ok_or_else(|| worker::Error::RustError("Missing reading_log_id parameter".to_string()))?;

    let reading_log = build_reading_log_for_laps(log_id);

    let db = database_from_ctx(&ctx)?;

    let laps = db.find_laps(reading_log).await.map_err(handle_db_error)?;

    Response::from_json(&laps)
}

/// DELETE /api/laps/:id - ラップを削除
pub async fn delete_lap(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    require_auth(&req, &ctx).await?;
    let id = ctx
        .param("id")
        .ok_or_else(|| worker::Error::RustError("Missing id parameter".to_string()))?;

    let db = database_from_ctx(&ctx)?;

    db.delete_lap(id.to_string())
        .await
        .map_err(handle_db_error)?;

    Response::ok("")
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // extract_reading_log_id のユニットテスト
    // ========================================

    #[test]
    fn extract_log_id_found() {
        let pairs = vec![("reading_log_id".to_string(), "log-123".to_string())];
        assert_eq!(
            extract_reading_log_id(pairs),
            Some("log-123".to_string())
        );
    }

    #[test]
    fn extract_log_id_not_found() {
        let pairs = vec![("other_key".to_string(), "value".to_string())];
        assert_eq!(extract_reading_log_id(pairs), None);
    }

    #[test]
    fn extract_log_id_empty_pairs() {
        assert_eq!(extract_reading_log_id(vec![]), None);
    }

    #[test]
    fn extract_log_id_multiple_params() {
        let pairs = vec![
            ("page".to_string(), "1".to_string()),
            ("reading_log_id".to_string(), "log-456".to_string()),
            ("limit".to_string(), "10".to_string()),
        ];
        assert_eq!(
            extract_reading_log_id(pairs),
            Some("log-456".to_string())
        );
    }

    // ========================================
    // build_reading_log_for_laps のユニットテスト
    // ========================================

    #[test]
    fn build_log_for_laps_sets_id() {
        let log = build_reading_log_for_laps("my-log-id".to_string());
        assert_eq!(log.id, Some("my-log-id".to_string()));
    }

    #[test]
    fn build_log_for_laps_uses_defaults() {
        let log = build_reading_log_for_laps("id".to_string());
        assert_eq!(log.isbn, 0);
        assert_eq!(log.session_duration_sec, 0);
        assert_eq!(log.page, [0, 0]);
        assert!(log.rating.is_none());
        assert!(log.created_at.is_empty());
    }
}
