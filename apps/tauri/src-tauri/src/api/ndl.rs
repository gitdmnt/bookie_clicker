use async_trait::async_trait;
use bookie_core::api::ndl::search_with_client;
use bookie_core::ports::{Clock, HttpClient};
use bookie_core::Book;
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

struct ReqwestClient {
    client: reqwest::Client,
}

impl ReqwestClient {
    fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl HttpClient for ReqwestClient {
    async fn get_text(&self, url: &str) -> Result<String, String> {
        let resp = self
            .client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;
        resp.text()
            .await
            .map_err(|e| format!("Read body error: {}", e))
    }
}

struct SystemClock;

impl Clock for SystemClock {
    fn now_rfc3339(&self) -> String {
        OffsetDateTime::now_utc()
            .format(&Rfc3339)
            .unwrap_or_else(|_| "".to_string())
    }
}

pub async fn search(isbn: &str) -> Result<Vec<Book>, String> {
    let client = ReqwestClient::new();
    let clock = SystemClock;
    search_with_client(isbn, &client, &clock).await
}
