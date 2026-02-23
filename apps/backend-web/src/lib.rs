mod db;
mod handlers;
mod middleware;
mod models;
mod session;
mod utils;

use worker::*;

#[event(fetch)]
async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let router = Router::new();

    router
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
        .get_async("/api/timer/sessions/current", handlers::timer::get_current_session)
        .patch_async("/api/timer/sessions/:id/stop", handlers::timer::stop_session)
        .patch_async("/api/timer/sessions/:id/resume", handlers::timer::resume_session)
        .post_async("/api/timer/sessions/:id/save", handlers::timer::save_session)
        .delete_async("/api/timer/sessions", handlers::timer::reset_session)
        //
        // Export
        .get_async("/api/export", handlers::export::export_database)
        .run(req, env)
        .await
}
