use worker::*;
use bookie_core::ports::{Filter, FilterValue, QueryBuilder};

use crate::db::database_from_ctx;
use crate::middleware::require_auth;
use crate::utils::errors::handle_db_error;

/// ユーザーIDスコープのQueryBuilderを構築する純粋関数
fn build_user_scoped_query(user_id: &str) -> QueryBuilder {
    QueryBuilder::new().filter(Filter::Eq(
        "user_id".to_string(),
        FilterValue::String(user_id.to_string()),
    ))
}

/// エクスポートレスポンス用のJSONシリアライズを行う純粋関数
fn serialize_export(
    books: Vec<bookie_core::domain::Book>,
    logs: Vec<bookie_core::domain::ReadingLog>,
) -> std::result::Result<String, String> {
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

    serde_json::to_string(&export).map_err(|e| format!("Failed to serialize export: {}", e))
}

/// GET /api/export - データベース全体をエクスポート
pub async fn export_database(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = require_auth(&req, &ctx).await?;
    let db = database_from_ctx(&ctx)?;

    // ユーザースコープでエクスポート
    let books_query = build_user_scoped_query(&user.id);
    let logs_query = build_user_scoped_query(&user.id);

    let books = db.find_books(books_query)
        .await
        .map_err(handle_db_error)?;
    let logs = db.find_reading_logs(logs_query)
        .await
        .map_err(handle_db_error)?;

    let json = serialize_export(books, logs)
        .map_err(worker::Error::RustError)?;

    #[derive(serde::Serialize)]
    struct DataWrapper {
        data: String,
    }

    Response::from_json(&DataWrapper { data: json })
}

#[cfg(test)]
mod tests {
    use super::*;
    use bookie_core::domain::{Book, ReadingLog};

    // ========================================
    // build_user_scoped_query のユニットテスト
    // ========================================

    #[test]
    fn user_scoped_query_has_user_id_filter() {
        let query = build_user_scoped_query("user-123");
        assert_eq!(query.filters.len(), 1);
        assert_eq!(
            query.filters[0],
            Filter::Eq("user_id".to_string(), FilterValue::String("user-123".to_string()))
        );
    }

    // ========================================
    // serialize_export のユニットテスト
    // ========================================

    #[test]
    fn serialize_export_empty() {
        let result = serialize_export(vec![], vec![]);
        assert!(result.is_ok());
        let json = result.unwrap();
        assert!(json.contains("\"books\":[]"));
        assert!(json.contains("\"readingLogs\":[]"));
    }

    #[test]
    fn serialize_export_with_data() {
        let books = vec![Book {
            isbn: 9784003101018,
            title: "テスト書籍".to_string(),
            series_title: None,
            authors: vec!["著者A".to_string()],
            publisher: "出版社".to_string(),
            year: 2024,
            page_count: 200,
            image_url: "".to_string(),
            created_at: None,
        }];
        let logs = vec![ReadingLog {
            id: Some("log-1".to_string()),
            isbn: 9784003101018,
            created_at: "2026-01-01T00:00:00+00:00".to_string(),
            session_duration_sec: 3600,
            page: [1, 50],
            rating: Some(4),
        }];
        let result = serialize_export(books, logs);
        assert!(result.is_ok());
        let json = result.unwrap();
        assert!(json.contains("テスト書籍"));
        assert!(json.contains("readingLogs"));
        assert!(json.contains("log-1"));
    }

    #[test]
    fn serialize_export_uses_camel_case_for_reading_logs() {
        let result = serialize_export(vec![], vec![]);
        assert!(result.is_ok());
        let json = result.unwrap();
        // readingLogs（camelCase）が使われている
        assert!(json.contains("readingLogs"));
        // reading_logs（snake_case）は使われない
        assert!(!json.contains("reading_logs"));
    }
}
