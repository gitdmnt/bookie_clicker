use actix_web;
use proconio::input;

mod search_book;

#[actix_web::main]
async fn main() {
    cli().await;
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
