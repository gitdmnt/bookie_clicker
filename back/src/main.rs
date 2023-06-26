use proconio::input;
mod search_book;
use actix_web;

#[actix_web::main]
async fn main() {
    loop {
        input! {isbn: String};
        let mut attribute = search_book::BookAttribute::default();
        attribute.isbn = isbn;
        attribute.search().await.unwrap();
    }
}
