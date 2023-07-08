// 次にやること
// 日時の取得

use actix_web;
use chrono;
use proconio::input;

mod database;
mod search_book;

#[actix_web::main]
async fn main() {
    cli();
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
