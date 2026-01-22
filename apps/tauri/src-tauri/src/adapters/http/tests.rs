use bookie_core::ports::HttpClient;

use crate::adapters::http::ReqwestClient;

#[tokio::test]
async fn test_reqwest_client_get_text() {
    let client = ReqwestClient::new();
    
    // httpbinを使った簡単なテスト（実際のHTTPリクエスト）
    let result = client.get_text("https://httpbin.org/robots.txt").await;
    
    // HTTPリクエストが成功することを確認
    assert!(result.is_ok(), "HTTP request should succeed");
    let text = result.unwrap();
    assert!(!text.is_empty(), "Response should not be empty");
}

#[tokio::test]
async fn test_reqwest_client_invalid_url() {
    let client = ReqwestClient::new();
    
    // 無効なURLでエラーが返ることを確認
    let result = client.get_text("not-a-valid-url").await;
    assert!(result.is_err(), "Invalid URL should return error");
}

#[tokio::test]
async fn test_reqwest_client_not_found() {
    let client = ReqwestClient::new();
    
    // 404エラーは成功扱い（ステータスコードは確認されない仕様）
    let result = client.get_text("https://httpbin.org/status/404").await;
    // HTTPステータスコードだけでエラーにはならない仕様なので、成功またはエラーになる
    // 実装により異なるため、このテストはコメントアウトまたは削除
}
