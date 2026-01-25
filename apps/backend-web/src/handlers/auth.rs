use worker::*;
use serde::{Deserialize, Serialize};

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
    let d1 = ctx.env.d1("DB")?;
    let user = UserManager::upsert_user(
        &d1,
        &user_info.sub,
        &user_info.email,
        user_info.name.as_deref(),
        user_info.picture.as_deref(),
    )
    .await?;
    
    // 4. セッション作成
    let session_token = SessionManager::create_session(&d1, &user.id).await?;
    
    // 5. httpOnly Cookie でセッショントークン返却
    #[derive(Serialize)]
    struct LoginResponse {
        user: User,
    }
    
    let mut response = Response::from_json(&LoginResponse { user })?;
    
    // Cookie設定
    let cookie = format!(
        "session={}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age={}",
        session_token,
        60 * 60 * 24 * 7 // 7日間
    );
    
    response.headers_mut().set("Set-Cookie", &cookie)?;
    
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
        let d1 = ctx.env.d1("DB")?;
        let _ = SessionManager::delete_session(&d1, &session_token).await;
    }
    
    let mut response = Response::ok("")?;
    response.headers_mut().set(
        "Set-Cookie",
        "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    )?;
    
    Ok(response)
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
    
    let mut headers = Headers::new();
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
/// セッショントークンはフロントエンドから送られてくるCookieの "session" に格納されていると想定
pub fn extract_session_token(req: &Request) -> Option<String> {
    let cookie_header = req.headers().get("Cookie").ok()??;
    
    for cookie in cookie_header.split(';') {
        let cookie = cookie.trim();
        if let Some(value) = cookie.strip_prefix("session=") {
            return Some(value.to_string());
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
    let d1 = ctx.env.d1("DB")?;
    
    // セッションを取得
    let session = SessionManager::get_session(&d1, &session_token)
        .await?
        .ok_or_else(|| Error::RustError("Session not found".to_string()))?;
    
    // セッションの有効期限を確認
    if session.is_expired() {
        SessionManager::delete_session(&d1, &session_token).await?;
        return Err(Error::RustError("Session expired".to_string()));
    }
    
    // ユーザーを取得
    let user = UserManager::get_user_by_id(&d1, &session.user_id)
        .await?
        .ok_or_else(|| Error::RustError("User not found".to_string()))?;
    
    Ok(user)
}
