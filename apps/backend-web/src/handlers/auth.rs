use serde::{Deserialize, Serialize};
use worker::*;

use crate::models::{GoogleIdToken, User};
use crate::session::{SessionManager, UserManager};

/// Google OAuth コールバック処理
pub async fn google_callback(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    #[derive(Deserialize)]
    struct CallbackRequest {
        code: String,
        code_verifier: String,
    }

    let body: CallbackRequest = req.json().await?;

    // 1. Google Token Endpoint でトークン交換
    let token_response = exchange_code_for_token(&body.code, &body.code_verifier, &ctx).await?;

    // 2. ID Token 検証（簡易版 - 本番環境では署名検証が必要）
    let user_info = decode_id_token(&token_response.id_token)?;

    // 3. ユーザー作成/更新
    let user = UserManager::upsert_user_from_ctx(
        &ctx,
        &user_info.sub,
        &user_info.email,
        user_info.name.as_deref(),
        user_info.picture.as_deref(),
    )
    .await?;

    // 4. セッション作成
    let session_token = SessionManager::create_session_from_ctx(&ctx, &user.id).await?;

    // 5. セッショントークンをJSONレスポンスで返す
    // Cookie方式はクロスオリジン（pages.dev → workers.dev）では
    // SameSite/Partitioned制限により動作しないため、Bearer Token方式を採用
    #[derive(Serialize)]
    struct LoginResponse {
        user: User,
        session_token: String,
    }

    let response = Response::from_json(&LoginResponse {
        user,
        session_token,
    })?;

    Ok(response)
}

/// 現在のユーザーを取得
pub async fn get_current_user(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = extract_user_from_request(&req, &ctx).await?;
    Response::from_json(&user)
}

/// ログアウト
pub async fn logout(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    if let Some(session_token) = extract_session_token(&req) {
        let _ = SessionManager::delete_session_from_ctx(&ctx, &session_token).await;
    }
    Response::ok("")
}

// ============================================================
// Helper Functions
// ============================================================

/// Google Token Endpoint でコードをトークンに交換
async fn exchange_code_for_token(
    code: &str,
    code_verifier: &str,
    ctx: &RouteContext<()>,
) -> Result<TokenResponse> {
    let client_id = ctx.env.var("GOOGLE_CLIENT_ID")?.to_string();
    let client_secret = ctx.env.secret("GOOGLE_CLIENT_SECRET")?.to_string();
    let redirect_uri = ctx.env.var("GOOGLE_REDIRECT_URI")?.to_string();

    #[derive(Serialize)]
    struct TokenRequest {
        code: String,
        client_id: String,
        client_secret: String,
        redirect_uri: String,
        grant_type: String,
        code_verifier: String,
    }

    let token_req = TokenRequest {
        code: code.to_string(),
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code".to_string(),
        code_verifier: code_verifier.to_string(),
    };

    let headers = Headers::new();
    headers.set("Content-Type", "application/x-www-form-urlencoded")?;

    let body = serde_urlencoded::to_string(&token_req)
        .map_err(|e| Error::RustError(format!("Failed to serialize request: {}", e)))?;

    let mut init = RequestInit::new();
    init.method = Method::Post;
    init.headers = headers;
    init.body = Some(body.into());

    let req = Request::new_with_init("https://oauth2.googleapis.com/token", &init)?;
    let mut resp = Fetch::Request(req).send().await?;

    if !(200..300).contains(&resp.status_code()) {
        let error_text = resp.text().await?;
        return Err(Error::RustError(format!(
            "Failed to exchange token: {}",
            error_text
        )));
    }

    let token_response: TokenResponse = resp.json().await?;
    Ok(token_response)
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct TokenResponse {
    access_token: String,
    id_token: String,
    expires_in: u64,
    token_type: String,
}

/// ID Token をデコード（簡易版 - 本番環境では署名検証が必要）
fn decode_id_token(id_token: &str) -> Result<GoogleIdToken> {
    // JWTの3部構成: header.payload.signature
    let parts: Vec<&str> = id_token.split('.').collect();
    if parts.len() != 3 {
        return Err(Error::RustError("Invalid ID token format".to_string()));
    }

    // Payloadをデコード
    let payload = parts[1];
    let decoded = base64_decode(payload)
        .map_err(|e| Error::RustError(format!("Failed to decode base64: {}", e)))?;

    let user_info: GoogleIdToken = serde_json::from_str(&decoded)
        .map_err(|e| Error::RustError(format!("Failed to parse ID token: {}", e)))?;

    Ok(user_info)
}

fn base64_decode(input: &str) -> std::result::Result<String, String> {
    use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};

    let bytes = URL_SAFE_NO_PAD
        .decode(input)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    String::from_utf8(bytes).map_err(|e| format!("UTF-8 decode error: {}", e))
}

/// リクエストからセッショントークンを抽出
/// Authorization: Bearer <token> ヘッダーから取得する
pub fn extract_session_token(req: &Request) -> Option<String> {
    // Authorization: Bearer <token> ヘッダーから取得
    if let Ok(Some(auth_header)) = req.headers().get("Authorization") {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            return Some(token.to_string());
        }
    }
    None
}

/// リクエストからユーザーを抽出
/// 1. リクエスト中のセッショントークンをデータベース中のセッション情報と照合して有効性を確認
/// 2. セッションが有効であれば対応するユーザー情報を取得して返す
pub async fn extract_user_from_request(req: &Request, ctx: &RouteContext<()>) -> Result<User> {
    // Cookieからセッショントークンを取得
    let session_token = extract_session_token(req)
        .ok_or_else(|| Error::RustError("No session token found".to_string()))?;

    // データベースへの接続情報を取得
    // セッションを取得
    let session = SessionManager::get_session_from_ctx(ctx, &session_token)
        .await?
        .ok_or_else(|| Error::RustError("Session not found".to_string()))?;

    // セッションの有効期限を確認
    if session.is_expired() {
        SessionManager::delete_session_from_ctx(ctx, &session_token).await?;
        return Err(Error::RustError("Session expired".to_string()));
    }

    // ユーザーを取得
    let user = UserManager::get_user_by_id_from_ctx(ctx, &session.user_id)
        .await?
        .ok_or_else(|| Error::RustError("User not found".to_string()))?;

    Ok(user)
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // base64_decode のユニットテスト
    // ========================================

    #[test]
    fn base64_decode_valid_input() {
        // "hello" を URL-safe Base64 (no pad) でエンコードしたもの
        let encoded = "aGVsbG8";
        let result = base64_decode(encoded);
        assert_eq!(result, Ok("hello".to_string()));
    }

    #[test]
    fn base64_decode_empty_input() {
        let result = base64_decode("");
        assert_eq!(result, Ok("".to_string()));
    }

    #[test]
    fn base64_decode_invalid_base64() {
        let result = base64_decode("!!!invalid!!!");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Base64 decode error"));
    }

    #[test]
    fn base64_decode_json_payload() {
        // {"sub":"123","email":"test@example.com"} のBase64URL
        use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
        let json = r#"{"sub":"123","email":"test@example.com"}"#;
        let encoded = URL_SAFE_NO_PAD.encode(json.as_bytes());
        let result = base64_decode(&encoded);
        assert_eq!(result, Ok(json.to_string()));
    }

    // ========================================
    // decode_id_token のユニットテスト
    // ========================================

    /// テスト用のJWTを構築するヘルパー
    fn build_test_jwt(payload_json: &str) -> String {
        use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
        let header = URL_SAFE_NO_PAD.encode(b"{}");
        let payload = URL_SAFE_NO_PAD.encode(payload_json.as_bytes());
        let signature = URL_SAFE_NO_PAD.encode(b"fake-sig");
        format!("{}.{}.{}", header, payload, signature)
    }

    #[test]
    fn decode_id_token_valid() {
        let payload = r#"{
            "sub": "google-user-id-123",
            "email": "user@example.com",
            "name": "Test User",
            "picture": "https://example.com/photo.jpg",
            "iss": "accounts.google.com",
            "aud": "client-id",
            "exp": 9999999999
        }"#;
        let jwt = build_test_jwt(payload);
        let result = decode_id_token(&jwt);
        assert!(result.is_ok());
        let token = result.unwrap();
        assert_eq!(token.sub, "google-user-id-123");
        assert_eq!(token.email, "user@example.com");
        assert_eq!(token.name, Some("Test User".to_string()));
        assert_eq!(
            token.picture,
            Some("https://example.com/photo.jpg".to_string())
        );
    }

    #[test]
    fn decode_id_token_minimal_fields() {
        let payload = r#"{
            "sub": "user-456",
            "email": "min@example.com",
            "iss": "accounts.google.com",
            "aud": "client-id",
            "exp": 9999999999
        }"#;
        let jwt = build_test_jwt(payload);
        let result = decode_id_token(&jwt);
        assert!(result.is_ok());
        let token = result.unwrap();
        assert_eq!(token.sub, "user-456");
        assert!(token.name.is_none());
        assert!(token.picture.is_none());
    }

    #[test]
    fn decode_id_token_invalid_format_no_dots() {
        let result = decode_id_token("not-a-jwt");
        assert!(result.is_err());
    }

    #[test]
    fn decode_id_token_invalid_format_two_parts() {
        let result = decode_id_token("header.payload");
        assert!(result.is_err());
    }

    #[test]
    fn decode_id_token_invalid_format_four_parts() {
        let result = decode_id_token("a.b.c.d");
        assert!(result.is_err());
    }

    #[test]
    fn decode_id_token_invalid_json() {
        use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
        let header = URL_SAFE_NO_PAD.encode(b"{}");
        let payload = URL_SAFE_NO_PAD.encode(b"not json");
        let sig = URL_SAFE_NO_PAD.encode(b"sig");
        let jwt = format!("{}.{}.{}", header, payload, sig);
        let result = decode_id_token(&jwt);
        assert!(result.is_err());
    }

    // ========================================
    // extract_session_token のユニットテスト
    // ========================================
    // Note: extract_session_token は worker::Request に依存するため、
    // native target ではテストできません。
    // ロジックの検証は結合テストで行います。
}
