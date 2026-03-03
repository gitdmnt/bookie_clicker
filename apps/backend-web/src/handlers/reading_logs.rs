use bookie_core::domain::ReadingLog;
use bookie_core::ports::{Filter, FilterValue, QueryBuilder};
use worker::*;

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// URLクエリパラメータからReadingLogのフィルタ付きQueryBuilderを構築する純粋関数
fn build_reading_log_filters(user_id: String, query_pairs: Vec<(String, String)>) -> QueryBuilder {
    let mut query = QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user_id),
    ));

    for (key, value) in query_pairs {
        match key.as_str() {
            "isbn" => {
                if let Ok(isbn) = value.parse::<u64>() {
                    query = query.filter(Filter::Eq("isbn".to_string(), FilterValue::U64(isbn)));
                }
            }
            "id" => {
                query = query.filter(Filter::Eq("id".to_string(), FilterValue::String(value)));
            }
            _ => {}
        }
    }

    query
}

/// DELETE用: URLクエリパラメータからidフィルタ付きQueryBuilderを構築する純粋関数
fn build_reading_log_delete_filters(
    user_id: String,
    query_pairs: Vec<(String, String)>,
) -> QueryBuilder {
    let mut query = QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user_id),
    ));

    for (key, value) in query_pairs {
        if key == "id" {
            query = query.filter(Filter::Eq("id".to_string(), FilterValue::String(value)));
        }
    }

    query
}

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
    let query_pairs: Vec<(String, String)> = url
        .query_pairs()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let query = build_reading_log_filters(user.id, query_pairs);

    let db = database_from_ctx(&ctx)?;
    let logs = db.find_reading_logs(query).await.map_err(handle_db_error)?;

    Response::from_json(&logs)
}

/// DELETE /api/reading-logs?id=abc - 読書ログを削除
pub async fn delete_reading_logs(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;

    let url = req.url()?;
    let query_pairs: Vec<(String, String)> = url
        .query_pairs()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let query = build_reading_log_delete_filters(user.id, query_pairs);

    let db = database_from_ctx(&ctx)?;
    db.delete_reading_logs(query)
        .await
        .map_err(handle_db_error)?;

    Response::ok("")
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // build_reading_log_filters のユニットテスト
    // ========================================

    #[test]
    fn reading_log_filters_no_params() {
        let query = build_reading_log_filters("user1".to_string(), vec![]);
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
    fn reading_log_filters_with_isbn() {
        let pairs = vec![("isbn".to_string(), "9784003101018".to_string())];
        let query = build_reading_log_filters("user1".to_string(), pairs);
        assert_eq!(query.filters.len(), 2);
        assert_eq!(
            query.filters[1],
            Filter::Eq("isbn".to_string(), FilterValue::U64(9784003101018))
        );
    }

    #[test]
    fn reading_log_filters_with_id() {
        let pairs = vec![("id".to_string(), "log-abc-123".to_string())];
        let query = build_reading_log_filters("user1".to_string(), pairs);
        assert_eq!(query.filters.len(), 2);
        assert_eq!(
            query.filters[1],
            Filter::Eq(
                "id".to_string(),
                FilterValue::String("log-abc-123".to_string())
            )
        );
    }

    #[test]
    fn reading_log_filters_with_isbn_and_id() {
        let pairs = vec![
            ("isbn".to_string(), "12345".to_string()),
            ("id".to_string(), "log-1".to_string()),
        ];
        let query = build_reading_log_filters("user1".to_string(), pairs);
        assert_eq!(query.filters.len(), 3);
    }

    #[test]
    fn reading_log_filters_invalid_isbn_ignored() {
        let pairs = vec![("isbn".to_string(), "not-a-number".to_string())];
        let query = build_reading_log_filters("user1".to_string(), pairs);
        // 無効なISBNは無視される
        assert_eq!(query.filters.len(), 1);
    }

    #[test]
    fn reading_log_filters_unknown_keys_ignored() {
        let pairs = vec![("unknown".to_string(), "value".to_string())];
        let query = build_reading_log_filters("user1".to_string(), pairs);
        assert_eq!(query.filters.len(), 1);
    }

    // ========================================
    // build_reading_log_delete_filters のユニットテスト
    // ========================================

    #[test]
    fn delete_filters_no_params() {
        let query = build_reading_log_delete_filters("user1".to_string(), vec![]);
        assert_eq!(query.filters.len(), 1);
    }

    #[test]
    fn delete_filters_with_id() {
        let pairs = vec![("id".to_string(), "log-delete-1".to_string())];
        let query = build_reading_log_delete_filters("user1".to_string(), pairs);
        assert_eq!(query.filters.len(), 2);
        assert_eq!(
            query.filters[1],
            Filter::Eq(
                "id".to_string(),
                FilterValue::String("log-delete-1".to_string())
            )
        );
    }

    #[test]
    fn delete_filters_ignores_isbn() {
        let pairs = vec![("isbn".to_string(), "12345".to_string())];
        let query = build_reading_log_delete_filters("user1".to_string(), pairs);
        // delete ではISBNフィルタは無視
        assert_eq!(query.filters.len(), 1);
    }
}
