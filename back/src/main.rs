use axum::{
    http::StatusCode,
    response::Html,
    routing::{get, post},
    Json, Router,
};
use chrono;
use database::{test_register_book, QueryData, ReadStatus};
use proconio::input;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

mod database;
mod search_book;

#[derive(Serialize, Deserialize)]
struct RegisterBook {
    user: i32,
    isbn: String,
}

#[tokio::main]
async fn main() {
    // initialize tracing
    tracing_subscriber::fmt::init();

    // build our application with a route
    let app = Router::new()
        // `GET /` goes to `root`
        .route("/", get(root))
        .route("/api/registerbook", post(register_book));

    // run our app with hyper
    // `axum::Server` is a re-export of `hyper::Server`
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn root() -> Html<&'static str> {
    Html("<h1>Hello, world!</h1>")
}

async fn register_book(Json(payload): Json<RegisterBook>) -> StatusCode {
    let mut attribute = search_book::BookAttribute::default();
    attribute.isbn = payload.isbn;
    match attribute.search().await {
        Ok(a) => println!("{}", a),
        Err(e) => println!("{}", e),
    }
    StatusCode::ACCEPTED
}

async fn cli() {
    loop {
        print!("input isbn:");
        input! {isbn: String};
        if &isbn == "" {
            return;
        }
        let mut attribute = search_book::BookAttribute::default();
        attribute.isbn = isbn;
        match attribute.search().await {
            Ok(a) => println!("{}", a),
            Err(e) => println!("{}", e),
        }
    }
}

fn parse_date() {
    match chrono::DateTime::parse_from_str("2020-01-01 00:00:00 +09:00", "%Y-%m-%d %H:%M:%S %z") {
        Ok(a) => println!("{:?}", a),
        Err(e) => println!("{}", e),
    }
}
