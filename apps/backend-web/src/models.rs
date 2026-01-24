use serde::{Deserialize, Serialize};

/// ユーザー情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub google_id: String,
    pub email: String,
    pub name: Option<String>,
    pub picture_url: Option<String>,
    pub created_at: String,
    pub last_login_at: String,
}

/// セッション情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub expires_at: String,
    pub created_at: String,
}

impl Session {
    pub fn is_expired(&self) -> bool {
        use chrono::{DateTime, Utc};
        let expires = DateTime::parse_from_rfc3339(&self.expires_at)
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
        let now = Utc::now();
        
        match expires {
            Some(exp) => exp < now,
            None => true,
        }
    }
}

/// Google ID Token の Claims
#[derive(Debug, Deserialize)]
pub struct GoogleIdToken {
    pub sub: String,        // Google user ID
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub iss: String,        // Issuer
    pub aud: String,        // Audience (client ID)
    pub exp: i64,          // Expiration time
}
