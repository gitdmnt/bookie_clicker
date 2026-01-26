use async_trait::async_trait;
use bookie_core::ports::HttpClient;
use worker::*;

/// HTTP client implementation using Cloudflare Workers Fetch API
pub struct FetchClient;

impl FetchClient {
    pub fn new() -> Self {
        FetchClient
    }
}

impl Default for FetchClient {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait(?Send)]
impl HttpClient for FetchClient {
    async fn get_text(&self, url: &str) -> Result<String, String> {
        let response = Fetch::Url(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
            .send()
            .await
            .map_err(|e| format!("Fetch failed: {}", e))?;
        
        response
            .text()
            .await
            .map_err(|e| format!("Failed to read response text: {}", e))
    }
}
