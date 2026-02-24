mod db;
mod handlers;
mod middleware;
mod models;
mod session;
mod utils;

use worker::*;

/// CORSヘッダーをレスポンスに付与する純粋関数
fn add_cors_headers(mut response: Response, origin: &str) -> Result<Response> {
    let headers = response.headers_mut();
    headers.set("Access-Control-Allow-Origin", origin)?;
    headers.set("Access-Control-Allow-Credentials", "true")?;
    headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    )?;
    headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Cookie",
    )?;
    Ok(response)
}

/// リクエストの Origin が許可されたものかを検証する純粋関数
/// FRONTEND_ORIGINS はカンマ区切りで複数指定可能
fn is_allowed_origin(request_origin: &str, allowed_origins: &str) -> bool {
    allowed_origins
        .split(',')
        .map(str::trim)
        .any(|o| o == request_origin)
}

/// OPTIONSプリフライトリクエストへのレスポンスを生成する純粋関数
fn preflight_response(origin: &str) -> Result<Response> {
    let response = Response::empty()?.with_status(204);
    add_cors_headers(response, origin)
}

#[event(fetch)]
async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    // FRONTEND_ORIGINS 環境変数から許可オリジン一覧を取得（カンマ区切り）
    let allowed_origins = env
        .var("FRONTEND_ORIGINS")
        .map(|v| v.to_string())
        .unwrap_or_default();

    // リクエストの Origin ヘッダーを取得
    let request_origin = req
        .headers()
        .get("Origin")
        .unwrap_or(None)
        .unwrap_or_default();

    // OPTIONSプリフライトリクエストを早期リターン
    if req.method() == Method::Options {
        if is_allowed_origin(&request_origin, &allowed_origins) {
            return preflight_response(&request_origin);
        }
        return Response::empty()?.with_status(204).into_ok();
    }

    let router = Router::new();

    let router_result = router
        //
        // Health check
        .get("/", |_, _| Response::ok("Bookie API Server"))
        .get("/health", |_, _| Response::ok("OK"))
        //
        // Authentication
        .post_async("/api/auth/google/callback", handlers::auth::google_callback)
        .get_async("/api/auth/me", handlers::auth::get_current_user)
        .post_async("/api/auth/logout", handlers::auth::logout)
        //
        // Book operations
        .post_async("/api/books", handlers::books::add_book)
        .get_async("/api/books", handlers::books::select_books)
        .delete_async("/api/books", handlers::books::delete_books)
        //
        // Book search
        .post_async("/api/books/search", handlers::books::search_books)
        //
        // ReadingLog operations
        .post_async("/api/reading-logs", handlers::reading_logs::add_reading_log)
        .get_async(
            "/api/reading-logs",
            handlers::reading_logs::select_reading_logs,
        )
        .delete_async(
            "/api/reading-logs",
            handlers::reading_logs::delete_reading_logs,
        )
        //
        // Lap operations
        .post_async("/api/laps", handlers::laps::add_laps)
        .get_async("/api/laps", handlers::laps::select_laps)
        .delete_async("/api/laps/:id", handlers::laps::delete_lap)
        //
        // Timer session operations
        .post_async("/api/timer/sessions", handlers::timer::start_session)
        .get_async(
            "/api/timer/sessions/current",
            handlers::timer::get_current_session,
        )
        .patch_async(
            "/api/timer/sessions/:id/stop",
            handlers::timer::stop_session,
        )
        .patch_async(
            "/api/timer/sessions/:id/resume",
            handlers::timer::resume_session,
        )
        .post_async("/api/timer/sessions/:id/save", handlers::timer::save_session)
        .delete_async("/api/timer/sessions", handlers::timer::reset_session)
        //
        // Export
        .get_async("/api/export", handlers::export::export_database)
        .run(req, env)
        .await;

    // ルーター処理中のエラーも含め、全レスポンスにCORSヘッダーを付与する
    // `.await?` を使わず、Errの場合も500レスポンスに変換してCORSヘッダーを付ける
    let response = match router_result {
        Ok(resp) => resp,
        Err(e) => Response::error(e.to_string(), 500)?,
    };

    // 許可オリジンからのリクエストにCORSヘッダーを付与
    if is_allowed_origin(&request_origin, &allowed_origins) {
        add_cors_headers(response, &request_origin)
    } else {
        Ok(response)
    }
}

trait IntoOk {
    fn into_ok(self) -> Result<Response>;
}

impl IntoOk for Response {
    fn into_ok(self) -> Result<Response> {
        Ok(self)
    }
}
