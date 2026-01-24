use worker::*;
use serde_json;
use chrono::{Duration, Utc};
use uuid::Uuid;

use crate::models::{User, Session};

/// セッション管理
pub struct SessionManager;

impl SessionManager {
    /// セッションを作成してD1に保存
    pub async fn create_session(d1: &D1Database, user_id: &str) -> Result<String> {
        let session_id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let expires_at = now + Duration::days(7); // 7日間有効
        
        let stmt = d1
            .prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
            .bind(&[
                session_id.clone().into(),
                user_id.into(),
                expires_at.to_rfc3339().into(),
                now.to_rfc3339().into(),
            ])
            .map_err(|e| Error::RustError(format!("Failed to bind session: {:?}", e)))?;
        
        stmt.run()
            .await
            .map_err(|e| Error::RustError(format!("Failed to create session: {:?}", e)))?;
        
        Ok(session_id)
    }
    
    /// セッションを取得
    pub async fn get_session(d1: &D1Database, session_id: &str) -> Result<Option<Session>> {
        let stmt = d1
            .prepare("SELECT * FROM sessions WHERE id = ?")
            .bind(&[session_id.into()])
            .map_err(|e| Error::RustError(format!("Failed to bind: {:?}", e)))?;
        
        let result = stmt
            .first::<serde_json::Value>(None)
            .await
            .map_err(|e| Error::RustError(format!("Failed to query session: {:?}", e)))?;
        
        match result {
            Some(row) => {
                let session = Session {
                    id: row.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    user_id: row.get("user_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    expires_at: row.get("expires_at").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    created_at: row.get("created_at").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                };
                Ok(Some(session))
            }
            None => Ok(None),
        }
    }
    
    /// セッションを削除
    pub async fn delete_session(d1: &D1Database, session_id: &str) -> Result<()> {
        let stmt = d1
            .prepare("DELETE FROM sessions WHERE id = ?")
            .bind(&[session_id.into()])
            .map_err(|e| Error::RustError(format!("Failed to bind: {:?}", e)))?;
        
        stmt.run()
            .await
            .map_err(|e| Error::RustError(format!("Failed to delete session: {:?}", e)))?;
        
        Ok(())
    }
    
    /// 期限切れセッションを削除（クリーンアップ）
    pub async fn cleanup_expired_sessions(d1: &D1Database) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        
        let stmt = d1
            .prepare("DELETE FROM sessions WHERE expires_at < ?")
            .bind(&[now.into()])
            .map_err(|e| Error::RustError(format!("Failed to bind: {:?}", e)))?;
        
        stmt.run()
            .await
            .map_err(|e| Error::RustError(format!("Failed to cleanup sessions: {:?}", e)))?;
        
        Ok(())
    }
}

/// ユーザー管理
pub struct UserManager;

impl UserManager {
    /// Google IDでユーザーを取得
    pub async fn get_user_by_google_id(d1: &D1Database, google_id: &str) -> Result<Option<User>> {
        let stmt = d1
            .prepare("SELECT * FROM users WHERE google_id = ?")
            .bind(&[google_id.into()])
            .map_err(|e| Error::RustError(format!("Failed to bind: {:?}", e)))?;
        
        let result = stmt
            .first::<serde_json::Value>(None)
            .await
            .map_err(|e| Error::RustError(format!("Failed to query user: {:?}", e)))?;
        
        match result {
            Some(row) => Ok(Some(Self::row_to_user(&row))),
            None => Ok(None),
        }
    }
    
    /// ユーザーIDでユーザーを取得
    pub async fn get_user_by_id(d1: &D1Database, user_id: &str) -> Result<Option<User>> {
        let stmt = d1
            .prepare("SELECT * FROM users WHERE id = ?")
            .bind(&[user_id.into()])
            .map_err(|e| Error::RustError(format!("Failed to bind: {:?}", e)))?;
        
        let result = stmt
            .first::<serde_json::Value>(None)
            .await
            .map_err(|e| Error::RustError(format!("Failed to query user: {:?}", e)))?;
        
        match result {
            Some(row) => Ok(Some(Self::row_to_user(&row))),
            None => Ok(None),
        }
    }
    
    /// ユーザーを作成または更新
    pub async fn upsert_user(
        d1: &D1Database,
        google_id: &str,
        email: &str,
        name: Option<&str>,
        picture_url: Option<&str>,
    ) -> Result<User> {
        let now = Utc::now().to_rfc3339();
        
        // 既存ユーザーを確認
        if let Some(mut user) = Self::get_user_by_google_id(d1, google_id).await? {
            // 既存ユーザーを更新
            let stmt = d1
                .prepare("UPDATE users SET email = ?, name = ?, picture_url = ?, last_login_at = ? WHERE google_id = ?")
                .bind(&[
                    email.into(),
                    name.unwrap_or("").into(),
                    picture_url.unwrap_or("").into(),
                    now.clone().into(),
                    google_id.into(),
                ])
                .map_err(|e| Error::RustError(format!("Failed to bind: {:?}", e)))?;
            
            stmt.run()
                .await
                .map_err(|e| Error::RustError(format!("Failed to update user: {:?}", e)))?;
            
            user.email = email.to_string();
            user.name = name.map(|s| s.to_string());
            user.picture_url = picture_url.map(|s| s.to_string());
            user.last_login_at = now;
            
            Ok(user)
        } else {
            // 新規ユーザーを作成
            let user_id = Uuid::new_v4().to_string();
            
            let stmt = d1
                .prepare("INSERT INTO users (id, google_id, email, name, picture_url, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
                .bind(&[
                    user_id.clone().into(),
                    google_id.into(),
                    email.into(),
                    name.unwrap_or("").into(),
                    picture_url.unwrap_or("").into(),
                    now.clone().into(),
                    now.clone().into(),
                ])
                .map_err(|e| Error::RustError(format!("Failed to bind: {:?}", e)))?;
            
            stmt.run()
                .await
                .map_err(|e| Error::RustError(format!("Failed to create user: {:?}", e)))?;
            
            Ok(User {
                id: user_id,
                google_id: google_id.to_string(),
                email: email.to_string(),
                name: name.map(|s| s.to_string()),
                picture_url: picture_url.map(|s| s.to_string()),
                created_at: now.clone(),
                last_login_at: now,
            })
        }
    }
    
    fn row_to_user(row: &serde_json::Value) -> User {
        User {
            id: row.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            google_id: row.get("google_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            email: row.get("email").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            name: row.get("name")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string()),
            picture_url: row.get("picture_url")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string()),
            created_at: row.get("created_at").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            last_login_at: row.get("last_login_at").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        }
    }
}
