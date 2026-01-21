use async_trait::async_trait;

#[async_trait]
pub trait HttpClient: Send + Sync {
    async fn get_text(&self, url: &str) -> Result<String, String>;
}

pub trait Clock: Send + Sync {
    fn now_rfc3339(&self) -> String;
}
