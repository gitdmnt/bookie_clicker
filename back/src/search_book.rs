// 次にやること
// エラーの定義

use core::fmt;

use reqwest;

#[derive(Default)]
pub struct BookAttribute {
    title: String,
    pub isbn: String,
    page: u32,
    image_url: String,
}

impl BookAttribute {
    pub async fn search(&self) -> Result<BookAttribute, SearchError> {
        let mut attribute = Ok(BookAttribute::default());
        if self.isbn != "" {
            attribute = self.search_book_from_isbn().await;
        }
        // todo タイトル検索とか
        attribute
    }
    async fn search_book_from_isbn(&self) -> Result<BookAttribute, SearchError> {
        // google books API を使いたいんですけど！
        let url = format!(
            "https://www.googleapis.com/books/v1/volumes?q=isbn:{}",
            &self.isbn
        );
        let attribute = fetch_attribute_from_url(url).await;
        attribute
    }
}

async fn fetch_attribute_from_url(url: String) -> Result<BookAttribute, SearchError> {
    let attribute_json = reqwest::get(url).await;
    let attribute = match attribute_json {
        Ok(json) => parse_json_to_attribute(json).await,
        Err(e) => {
            println!("{}", e);
            Err(SearchError {
                e: "something went wrong".to_owned(),
            })
        }
    };
    attribute
}

async fn parse_json_to_attribute(json: reqwest::Response) -> Result<BookAttribute, SearchError> {
    println!("{:?}", json.text().await);
    todo!()
}

#[derive(Debug, Clone)]
pub struct SearchError {
    e: String,
}

impl fmt::Display for SearchError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.e)
    }
}

impl std::error::Error for SearchError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        None
    }
}
