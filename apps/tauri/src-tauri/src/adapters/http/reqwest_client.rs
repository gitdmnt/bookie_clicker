use async_trait::async_trait;
use bookie_core::ports::HttpClient;

/// HTTP client implementation using reqwest
pub struct ReqwestClient {
    client: reqwest::Client,
}

impl ReqwestClient {
    pub fn new() -> Self {
        ReqwestClient {
            client: reqwest::Client::new(),
        }
    }
}

impl Default for ReqwestClient {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl HttpClient for ReqwestClient {
    async fn get_text(&self, url: &str) -> Result<String, String> {
        self.client
            .get(url)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .text()
            .await
            .map_err(|e| e.to_string())
    }
}
