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
    pub sub: String, // Google user ID
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub iss: String, // Issuer
    pub aud: String, // Audience (client ID)
    pub exp: i64,    // Expiration time
}

/// タイマーセッション
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerSession {
    pub id: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "startTime")]
    pub start_time: String,
    #[serde(rename = "stopTime")]
    pub stop_time: Option<String>,
    #[serde(rename = "isSaved")]
    pub is_saved: bool,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_is_expired_true_for_past_date() {
        let session = Session {
            id: "s1".to_string(),
            user_id: "u1".to_string(),
            expires_at: "2020-01-01T00:00:00+00:00".to_string(),
            created_at: "2020-01-01T00:00:00+00:00".to_string(),
        };
        assert!(session.is_expired());
    }

    #[test]
    fn session_is_expired_false_for_future_date() {
        let session = Session {
            id: "s1".to_string(),
            user_id: "u1".to_string(),
            expires_at: "2099-12-31T23:59:59+00:00".to_string(),
            created_at: "2020-01-01T00:00:00+00:00".to_string(),
        };
        assert!(!session.is_expired());
    }

    #[test]
    fn session_is_expired_true_for_invalid_format() {
        let session = Session {
            id: "s1".to_string(),
            user_id: "u1".to_string(),
            expires_at: "not-a-date".to_string(),
            created_at: "2020-01-01T00:00:00+00:00".to_string(),
        };
        assert!(session.is_expired());
    }

    #[test]
    fn timer_session_serializes_to_camel_case() {
        let ts = TimerSession {
            id: "ts1".to_string(),
            user_id: "u1".to_string(),
            start_time: "2026-02-23T10:00:00+00:00".to_string(),
            stop_time: None,
            is_saved: false,
            created_at: "2026-02-23T10:00:00+00:00".to_string(),
            updated_at: "2026-02-23T10:00:00+00:00".to_string(),
        };
        let json = serde_json::to_string(&ts).unwrap();
        assert!(json.contains("\"userId\""));
        assert!(json.contains("\"startTime\""));
        assert!(json.contains("\"stopTime\""));
        assert!(json.contains("\"isSaved\""));
        assert!(json.contains("\"createdAt\""));
        assert!(json.contains("\"updatedAt\""));
        assert!(!json.contains("\"user_id\""));
    }

    #[test]
    fn timer_session_deserializes_from_camel_case() {
        let json = r#"{
            "id": "ts1",
            "userId": "u1",
            "startTime": "2026-02-23T10:00:00+00:00",
            "stopTime": null,
            "isSaved": false,
            "createdAt": "2026-02-23T10:00:00+00:00",
            "updatedAt": "2026-02-23T10:00:00+00:00"
        }"#;
        let ts: TimerSession = serde_json::from_str(json).unwrap();
        assert_eq!(ts.id, "ts1");
        assert_eq!(ts.user_id, "u1");
        assert!(ts.stop_time.is_none());
        assert!(!ts.is_saved);
    }

    #[test]
    fn timer_session_deserializes_with_stop_time() {
        let json = r#"{
            "id": "ts1",
            "userId": "u1",
            "startTime": "2026-02-23T10:00:00+00:00",
            "stopTime": "2026-02-23T11:00:00+00:00",
            "isSaved": true,
            "createdAt": "2026-02-23T10:00:00+00:00",
            "updatedAt": "2026-02-23T11:00:00+00:00"
        }"#;
        let ts: TimerSession = serde_json::from_str(json).unwrap();
        assert_eq!(ts.stop_time, Some("2026-02-23T11:00:00+00:00".to_string()));
        assert!(ts.is_saved);
    }
}
