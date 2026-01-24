use worker::*;
use crate::handlers::auth::extract_user_from_request;
use crate::models::User;

/// 認証が必要なエンドポイント用のミドルウェア
pub async fn require_auth(req: &Request, ctx: &RouteContext<()>) -> Result<User> {
    extract_user_from_request(req, ctx).await
}
