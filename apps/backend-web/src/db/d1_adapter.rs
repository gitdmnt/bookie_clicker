use bookie_core::domain::{Book, Lap, ReadingLog};
use bookie_core::ports::{DbError, Filter, FilterValue, QueryBuilder};
use chrono::Utc;
use serde_json;
use worker::D1Database as WorkerD1;

pub struct D1Database {
    db: WorkerD1,
}

impl D1Database {
    pub fn new(db: WorkerD1) -> Self {
        Self { db }
    }

    /// Ensure book metadata exists in books_master and create user_books entry for user
    pub async fn add_book_with_user(&self, book: Book, user_id: &str) -> Result<(), DbError> {
        // upsert into books_master (insert if not exists)
        let authors_json = serde_json::to_string(&book.authors)
            .map_err(|e| DbError::Query(format!("Failed to serialize authors: {}", e)))?;

        // Insert into books_master if missing
        let stmt = self
            .db
            .prepare("INSERT OR IGNORE INTO books_master (isbn, title, series_title, authors, publisher, year, page_count, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&[
                book.isbn.to_string().into(),
                book.title.into(),
                book.series_title.unwrap_or_default().into(),
                authors_json.into(),
                book.publisher.into(),
                book.year.to_string().into(),
                book.page_count.to_string().into(),
                book.image_url.into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind parameters for books_master: {:?}", e)))?;

        stmt.run()
            .await
            .map_err(|e| DbError::Query(format!("Failed to insert into books_master: {:?}", e)))?;

        // Insert into user_books (fail on unique if already owned)
        let user_book_id = ulid::Ulid::new().to_string();
        let added_at = Utc::now().to_rfc3339();

        let stmt = self
            .db
            .prepare("INSERT INTO user_books (id, user_id, isbn, added_at) VALUES (?, ?, ?, ?)")
            .bind(&[
                user_book_id.into(),
                user_id.into(),
                book.isbn.to_string().into(),
                added_at.into(),
            ])
            .map_err(|e| {
                DbError::Query(format!("Failed to bind parameters for user_books: {:?}", e))
            })?;

        stmt.run().await.map_err(|e| {
            if e.to_string().contains("UNIQUE") {
                DbError::UniqueConstraint(format!(
                    "User {} already has ISBN {}",
                    user_id, book.isbn
                ))
            } else {
                DbError::Query(format!("Failed to insert user_books: {:?}", e))
            }
        })?;

        Ok(())
    }

    pub async fn add_reading_log_with_user(
        &self,
        log: ReadingLog,
        user_id: &str,
    ) -> Result<String, DbError> {
        // Ensure user_book exists
        let isbn = log.isbn;
        let mut stmt = self
            .db
            .prepare("SELECT id FROM user_books WHERE user_id = ? AND isbn = ? LIMIT 1");

        stmt = stmt
            .bind(&[user_id.into(), isbn.to_string().into()])
            .map_err(|e| DbError::Query(format!("Failed to bind select user_books: {:?}", e)))?;

        let result = stmt
            .all()
            .await
            .map_err(|e| DbError::Query(format!("Failed to query user_books: {:?}", e)))?;

        let rows = result
            .results::<serde_json::Value>()
            .map_err(|e| DbError::Query(format!("Failed to parse user_books results: {:?}", e)))?;

        let user_book_id = if let Some(row) = rows.into_iter().next() {
            row.get("id")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .ok_or_else(|| DbError::Query("Failed to read user_book id".to_string()))?
        } else {
            return Err(DbError::Query(format!(
                "No user_book found for user_id {} and isbn {}",
                user_id, isbn
            )));
        };

        // insert reading log with reference to user_book_id
        let id = log
            .id
            .clone()
            .unwrap_or_else(|| ulid::Ulid::new().to_string());

        let mut stmt = self.db.prepare("INSERT INTO reading_logs (id, user_book_id, created_at, session_duration_sec, page_start, page_end, rating) VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt = stmt
            .bind(&[
                id.clone().into(),
                user_book_id.into(),
                log.created_at.into(),
                log.session_duration_sec.to_string().into(),
                log.page[0].to_string().into(),
                log.page[1].to_string().into(),
                log.rating.map(|r| r.to_string()).unwrap_or_default().into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind insert reading_logs: {:?}", e)))?;

        stmt.run()
            .await
            .map_err(|e| DbError::Query(format!("Failed to insert reading log: {:?}", e)))?;

        Ok(id)
    }

    pub async fn add_laps_with_user(
        &self,
        reading_log: ReadingLog,
        laps: Vec<Lap>,
        user_id: &str,
    ) -> Result<(), DbError> {
        let log_id = match reading_log.id {
            Some(id) => id,
            None => self.add_reading_log_with_user(reading_log, user_id).await?,
        };

        for lap in laps {
            let lap_id = lap
                .id
                .clone()
                .unwrap_or_else(|| ulid::Ulid::new().to_string());

            let stmt = self
                .db
                .prepare("INSERT INTO laps (id, reading_log_id, elapsed_ms, note, ref_page, created_at) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(&[
                    lap_id.into(),
                    log_id.clone().into(),
                    lap.elapsed_ms.to_string().into(),
                    lap.note.unwrap_or_default().into(),
                    lap.ref_page.map(|p| p.to_string()).unwrap_or_default().into(),
                    lap.created_at.into(),
                ])
                .map_err(|e| DbError::Query(format!("Failed to bind parameters: {:?}", e)))?;

            stmt.run()
                .await
                .map_err(|e| DbError::Query(format!("Failed to insert lap: {:?}", e)))?;
        }

        Ok(())
    }

    /// QueryBuilder を SQL WHERE 句に変換
    fn build_where_clause(&self, query: &QueryBuilder) -> (String, Vec<String>) {
        if query.filters.is_empty() {
            return (String::new(), Vec::new());
        }

        let mut conditions = Vec::new();
        let mut params = Vec::new();

        for filter in &query.filters {
            match filter {
                Filter::Eq(field, value) => {
                    conditions.push(format!("{} = ?", field));
                    params.push(self.filter_value_to_string(value));
                }
                Filter::Gte(field, value) => {
                    conditions.push(format!("{} >= ?", field));
                    params.push(self.filter_value_to_string(value));
                }
                Filter::Lte(field, value) => {
                    conditions.push(format!("{} <= ?", field));
                    params.push(self.filter_value_to_string(value));
                }
                Filter::Contains(field, value) => {
                    conditions.push(format!("{} LIKE ?", field));
                    params.push(format!("%{}%", value));
                }
            }
        }

        let where_clause = format!(" WHERE {}", conditions.join(" AND "));
        (where_clause, params)
    }

    fn filter_value_to_string(&self, value: &FilterValue) -> String {
        match value {
            FilterValue::String(s) => s.clone(),
            FilterValue::U64(n) => n.to_string(),
            FilterValue::U32(n) => n.to_string(),
            FilterValue::U16(n) => n.to_string(),
            FilterValue::U8(n) => n.to_string(),
        }
    }

    fn apply_limit_offset(&self, query: &QueryBuilder) -> String {
        let mut clause = String::new();
        if let Some(limit) = query.limit {
            clause.push_str(&format!(" LIMIT {}", limit));
        }
        if let Some(offset) = query.offset {
            clause.push_str(&format!(" OFFSET {}", offset));
        }
        clause
    }

    /// Upsert book metadata into books_master
    pub async fn upsert_books_master(&self, book: &Book) -> Result<(), DbError> {
        let authors_json = serde_json::to_string(&book.authors)
            .map_err(|e| DbError::Query(format!("Failed to serialize authors: {}", e)))?;

        let stmt = self
            .db
            .prepare("INSERT OR IGNORE INTO books_master (isbn, title, series_title, authors, publisher, year, page_count, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&[
                book.isbn.to_string().into(),
                book.title.clone().into(),
                book.series_title.clone().unwrap_or_default().into(),
                authors_json.into(),
                book.publisher.clone().into(),
                book.year.to_string().into(),
                book.page_count.to_string().into(),
                book.image_url.clone().into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind parameters for upsert books_master: {:?}", e)))?;

        stmt.run()
            .await
            .map_err(|e| DbError::Query(format!("Failed to upsert books_master: {:?}", e)))?;
        Ok(())
    }

    pub async fn find_books(&self, query: QueryBuilder) -> Result<Vec<Book>, DbError> {
        // If query contains user_id filter, join user_books -> books_master to return only user's books
        let mut user_id_opt: Option<String> = None;
        let mut isbn_opt: Option<u64> = None;
        for f in &query.filters {
            if let Filter::Eq(field, ref val) = f {
                if field == "user_id" {
                    if let FilterValue::String(s) = val.clone() {
                        user_id_opt = Some(s);
                    }
                }
                if field == "isbn" {
                    if let FilterValue::U64(n) = val.clone() {
                        isbn_opt = Some(n);
                    }
                }
            }
        }

        let limit_offset = self.apply_limit_offset(&query);

        if let Some(user_id) = user_id_opt {
            let mut clauses = vec!["ub.user_id = ?".to_string()];
            let mut params = vec![user_id.clone()];
            if let Some(isbn) = isbn_opt {
                clauses.push("bm.isbn = ?".to_string());
                params.push(isbn.to_string());
            }
            let where_clause = format!(" WHERE {}", clauses.join(" AND "));
            let sql = format!(
                "SELECT bm.* FROM books_master bm INNER JOIN user_books ub ON ub.isbn = bm.isbn{}{}",
                where_clause, limit_offset
            );

            let mut stmt = self.db.prepare(&sql);
            for p in params {
                stmt = stmt
                    .bind(&[p.into()])
                    .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
            }
            let result = stmt
                .all()
                .await
                .map_err(|e| DbError::Query(format!("Failed to query joined books: {:?}", e)))?;

            let books: Vec<Book> = result
                .results::<serde_json::Value>()
                .map_err(|e| DbError::Query(format!("Failed to parse results: {:?}", e)))?
                .into_iter()
                .filter_map(|row| {
                    Some(Book {
                        isbn: row.get("isbn")?.as_u64()?,
                        title: row.get("title")?.as_str()?.to_string(),
                        series_title: row.get("series_title").and_then(|v| v.as_str()).and_then(
                            |s| {
                                if s.is_empty() {
                                    None
                                } else {
                                    Some(s.to_string())
                                }
                            },
                        ),
                        authors: serde_json::from_str(row.get("authors")?.as_str()?).ok()?,
                        publisher: row.get("publisher")?.as_str()?.to_string(),
                        year: row.get("year")?.as_u64()? as u32,
                        page_count: row.get("page_count")?.as_u64()? as u32,
                        image_url: row.get("image_url")?.as_str()?.to_string(),
                        created_at: None,
                    })
                })
                .collect();

            Ok(books)
        } else {
            // No user filter - return from books_master
            let sql = format!("SELECT * FROM books_master{}", limit_offset);
            let stmt = self.db.prepare(&sql);
            let result = stmt
                .all()
                .await
                .map_err(|e| DbError::Query(format!("Failed to query books_master: {:?}", e)))?;

            let books: Vec<Book> = result
                .results::<serde_json::Value>()
                .map_err(|e| DbError::Query(format!("Failed to parse results: {:?}", e)))?
                .into_iter()
                .filter_map(|row| {
                    Some(Book {
                        isbn: row.get("isbn")?.as_u64()?,
                        title: row.get("title")?.as_str()?.to_string(),
                        series_title: row.get("series_title").and_then(|v| v.as_str()).and_then(
                            |s| {
                                if s.is_empty() {
                                    None
                                } else {
                                    Some(s.to_string())
                                }
                            },
                        ),
                        authors: serde_json::from_str(row.get("authors")?.as_str()?).ok()?,
                        publisher: row.get("publisher")?.as_str()?.to_string(),
                        year: row.get("year")?.as_u64()? as u32,
                        page_count: row.get("page_count")?.as_u64()? as u32,
                        image_url: row.get("image_url")?.as_str()?.to_string(),
                        created_at: None,
                    })
                })
                .collect();

            Ok(books)
        }
    }

    pub async fn delete_books(&self, query: QueryBuilder) -> Result<(), DbError> {
        // If user_id is present, delete from user_books only; otherwise delete from books_master
        let mut user_id_opt: Option<String> = None;
        let mut isbn_opt: Option<u64> = None;
        for f in &query.filters {
            if let Filter::Eq(field, ref val) = f {
                if field == "user_id" {
                    if let FilterValue::String(s) = val.clone() {
                        user_id_opt = Some(s);
                    }
                }
                if field == "isbn" {
                    if let FilterValue::U64(n) = val.clone() {
                        isbn_opt = Some(n);
                    }
                }
            }
        }

        if let Some(user_id) = user_id_opt {
            // delete from user_books
            let mut clauses = vec!["user_id = ?".to_string()];
            let mut params = vec![user_id.clone()];
            if let Some(isbn) = isbn_opt {
                clauses.push("isbn = ?".to_string());
                params.push(isbn.to_string());
            }
            let where_clause = format!(" WHERE {}", clauses.join(" AND "));
            let sql = format!("DELETE FROM user_books{}", where_clause);

            let mut stmt = self.db.prepare(&sql);
            for p in params {
                stmt = stmt
                    .bind(&[p.into()])
                    .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
            }

            stmt.run()
                .await
                .map_err(|e| DbError::Query(format!("Failed to delete user_books: {:?}", e)))?;

            Ok(())
        } else {
            // delete from books_master
            let (where_clause, params) = self.build_where_clause(&query);
            let sql = format!("DELETE FROM books_master{}", where_clause);

            let mut stmt = self.db.prepare(&sql);

            for param in params {
                stmt = stmt
                    .bind(&[param.into()])
                    .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
            }

            stmt.run()
                .await
                .map_err(|e| DbError::Query(format!("Failed to delete books_master: {:?}", e)))?;

            Ok(())
        }
    }

    pub async fn find_reading_logs(&self, query: QueryBuilder) -> Result<Vec<ReadingLog>, DbError> {
        // Build query conditions manually, joining reading_logs -> user_books to obtain isbn and filter by user_id if provided
        let mut user_id_opt: Option<String> = None;
        let mut isbn_opt: Option<u64> = None;
        let mut id_opt: Option<String> = None;
        for f in &query.filters {
            if let Filter::Eq(field, ref val) = f {
                if field == "user_id" {
                    if let FilterValue::String(s) = val.clone() {
                        user_id_opt = Some(s);
                    }
                }
                if field == "isbn" {
                    if let FilterValue::U64(n) = val.clone() {
                        isbn_opt = Some(n);
                    }
                }
                if field == "id" {
                    if let FilterValue::String(s) = val.clone() {
                        id_opt = Some(s);
                    }
                }
            }
        }

        let mut clauses = Vec::new();
        let mut params: Vec<String> = Vec::new();

        if let Some(user_id) = user_id_opt.clone() {
            clauses.push("ub.user_id = ?".to_string());
            params.push(user_id);
        }
        if let Some(isbn) = isbn_opt {
            clauses.push("ub.isbn = ?".to_string());
            params.push(isbn.to_string());
        }
        if let Some(id) = id_opt {
            clauses.push("rl.id = ?".to_string());
            params.push(id);
        }

        let where_clause = if clauses.is_empty() {
            String::new()
        } else {
            format!(" WHERE {}", clauses.join(" AND "))
        };
        let limit_offset = self.apply_limit_offset(&query);

        let sql = format!("SELECT rl.id as id, ub.isbn as isbn, rl.created_at, rl.session_duration_sec, rl.page_start, rl.page_end, rl.rating FROM reading_logs rl JOIN user_books ub ON rl.user_book_id = ub.id{}{}", where_clause, limit_offset);

        let mut stmt = self.db.prepare(&sql);
        for p in params {
            stmt = stmt
                .bind(&[p.into()])
                .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
        }

        let result = stmt.all().await.map_err(|e| {
            DbError::Query(format!("Failed to query reading logs (joined): {:?}", e))
        })?;

        let logs: Vec<ReadingLog> = result
            .results::<serde_json::Value>()
            .map_err(|e| DbError::Query(format!("Failed to parse results: {:?}", e)))?
            .into_iter()
            .filter_map(|row| {
                Some(ReadingLog {
                    id: row.get("id")?.as_str().map(|s| s.to_string()),
                    isbn: row.get("isbn")?.as_u64()?,
                    created_at: row.get("created_at")?.as_str()?.to_string(),
                    session_duration_sec: row.get("session_duration_sec")?.as_u64()?,
                    page: [
                        row.get("page_start")?.as_u64()? as u16,
                        row.get("page_end")?.as_u64()? as u16,
                    ],
                    rating: row.get("rating").and_then(|v| v.as_u64()).map(|r| r as u8),
                })
            })
            .collect();

        Ok(logs)
    }

    pub async fn delete_reading_logs(&self, query: QueryBuilder) -> Result<(), DbError> {
        // If user_id filter present, ensure deletion is scoped to that user's reading logs
        let mut user_id_opt: Option<String> = None;
        let mut id_opt: Option<String> = None;
        for f in &query.filters {
            if let Filter::Eq(field, ref val) = f {
                if field == "user_id" {
                    if let FilterValue::String(s) = val.clone() {
                        user_id_opt = Some(s);
                    }
                }
                if field == "id" {
                    if let FilterValue::String(s) = val.clone() {
                        id_opt = Some(s);
                    }
                }
            }
        }

        if let Some(user_id) = user_id_opt {
            let mut clauses = vec!["ub.user_id = ?".to_string()];
            let mut params = vec![user_id.clone()];
            if let Some(id) = id_opt {
                clauses.push("rl.id = ?".to_string());
                params.push(id);
            }
            let where_clause = format!(" WHERE {}", clauses.join(" AND "));
            let sql = format!(
                "DELETE FROM reading_logs WHERE id IN (SELECT rl.id FROM reading_logs rl JOIN user_books ub ON rl.user_book_id = ub.id{} )",
                where_clause
            );

            let mut stmt = self.db.prepare(&sql);
            for p in params {
                stmt = stmt
                    .bind(&[p.into()])
                    .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
            }

            stmt.run()
                .await
                .map_err(|e| DbError::Query(format!("Failed to delete reading logs: {:?}", e)))?;

            Ok(())
        } else {
            // Fallback: delete by id or other filters directly on reading_logs
            let (where_clause, params) = self.build_where_clause(&query);
            let sql = format!("DELETE FROM reading_logs{}", where_clause);

            let mut stmt = self.db.prepare(&sql);

            for param in params {
                stmt = stmt
                    .bind(&[param.into()])
                    .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
            }

            stmt.run()
                .await
                .map_err(|e| DbError::Query(format!("Failed to delete reading logs: {:?}", e)))?;

            Ok(())
        }
    }

    pub async fn find_laps(&self, reading_log: ReadingLog) -> Result<Vec<Lap>, DbError> {
        let log_id = reading_log
            .id
            .ok_or_else(|| DbError::Query("ReadingLog must have an ID to find laps".to_string()))?;

        let stmt = self
            .db
            .prepare("SELECT * FROM laps WHERE reading_log_id = ?")
            .bind(&[log_id.into()])
            .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;

        let result = stmt
            .all()
            .await
            .map_err(|e| DbError::Query(format!("Failed to query laps: {:?}", e)))?;

        let laps: Vec<Lap> = result
            .results::<serde_json::Value>()
            .map_err(|e| DbError::Query(format!("Failed to parse results: {:?}", e)))?
            .into_iter()
            .filter_map(|row| {
                Some(Lap {
                    id: row.get("id")?.as_str().map(|s| s.to_string()),
                    elapsed_ms: row.get("elapsed_ms")?.as_u64()?,
                    note: row.get("note").and_then(|v| v.as_str()).and_then(|s| {
                        if s.is_empty() {
                            None
                        } else {
                            Some(s.to_string())
                        }
                    }),
                    ref_page: row
                        .get("ref_page")
                        .and_then(|v| v.as_u64())
                        .map(|p| p as u32),
                    created_at: row.get("created_at")?.as_str()?.to_string(),
                })
            })
            .collect();

        Ok(laps)
    }

    pub async fn delete_lap(&self, id: String) -> Result<(), DbError> {
        let stmt = self
            .db
            .prepare("DELETE FROM laps WHERE id = ?")
            .bind(&[id.into()])
            .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;

        stmt.run()
            .await
            .map_err(|e| DbError::Query(format!("Failed to delete lap: {:?}", e)))?;

        Ok(())
    }

    // ================================================================
    // Timer Session operations
    // ================================================================

    /// Create a new timer session for the user.
    /// If the user already has an active (unsaved, non-stopped) session, return it instead.
    pub async fn create_timer_session(&self, user_id: &str) -> Result<crate::models::TimerSession, DbError> {
        // Check for existing active session (not saved and not stopped)
        let stmt = self
            .db
            .prepare("SELECT id, user_id, start_time, stop_time, is_saved, created_at, updated_at FROM timer_sessions WHERE user_id = ? AND is_saved = 0 AND stop_time IS NULL LIMIT 1")
            .bind(&[user_id.into()])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        let result = stmt.all().await.map_err(|e| DbError::Query(format!("Failed to query: {:?}", e)))?;
        let rows = result.results::<serde_json::Value>().map_err(|e| DbError::Query(format!("Failed to parse: {:?}", e)))?;

        if let Some(row) = rows.into_iter().next() {
            return Ok(self.parse_timer_session(&row)?);
        }

        // Create new session
        let id = ulid::Ulid::new().to_string();
        let now = Utc::now().to_rfc3339();

        let stmt = self
            .db
            .prepare("INSERT INTO timer_sessions (id, user_id, start_time, is_saved, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)")
            .bind(&[
                id.clone().into(),
                user_id.into(),
                now.clone().into(),
                now.clone().into(),
                now.clone().into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        stmt.run().await.map_err(|e| DbError::Query(format!("Failed to insert timer_session: {:?}", e)))?;

        Ok(crate::models::TimerSession {
            id,
            user_id: user_id.to_string(),
            start_time: now.clone(),
            stop_time: None,
            is_saved: false,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    /// Stop a timer session (set stop_time to now).
    pub async fn stop_timer_session(&self, session_id: &str, user_id: &str) -> Result<crate::models::TimerSession, DbError> {
        let now = Utc::now().to_rfc3339();

        let stmt = self
            .db
            .prepare("UPDATE timer_sessions SET stop_time = ?, updated_at = ? WHERE id = ? AND user_id = ? AND stop_time IS NULL AND is_saved = 0")
            .bind(&[
                now.clone().into(),
                now.clone().into(),
                session_id.into(),
                user_id.into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        stmt.run().await.map_err(|e| DbError::Query(format!("Failed to update timer_session: {:?}", e)))?;

        self.get_timer_session(session_id, user_id).await
    }

    /// Resume a stopped timer session (clear stop_time).
    pub async fn resume_timer_session(&self, session_id: &str, user_id: &str) -> Result<crate::models::TimerSession, DbError> {
        let now = Utc::now().to_rfc3339();

        let stmt = self
            .db
            .prepare("UPDATE timer_sessions SET stop_time = NULL, updated_at = ? WHERE id = ? AND user_id = ? AND is_saved = 0")
            .bind(&[
                now.into(),
                session_id.into(),
                user_id.into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        stmt.run().await.map_err(|e| DbError::Query(format!("Failed to update timer_session: {:?}", e)))?;

        self.get_timer_session(session_id, user_id).await
    }

    /// Get a specific timer session by id and user.
    pub async fn get_timer_session(&self, session_id: &str, user_id: &str) -> Result<crate::models::TimerSession, DbError> {
        let stmt = self
            .db
            .prepare("SELECT id, user_id, start_time, stop_time, is_saved, created_at, updated_at FROM timer_sessions WHERE id = ? AND user_id = ?")
            .bind(&[session_id.into(), user_id.into()])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        let result = stmt.all().await.map_err(|e| DbError::Query(format!("Failed to query: {:?}", e)))?;
        let rows = result.results::<serde_json::Value>().map_err(|e| DbError::Query(format!("Failed to parse: {:?}", e)))?;

        let row = rows.into_iter().next().ok_or(DbError::NotFound)?;
        self.parse_timer_session(&row)
    }

    /// Get the current (unsaved) timer session for the user.
    pub async fn get_current_timer_session(&self, user_id: &str) -> Result<Option<crate::models::TimerSession>, DbError> {
        let stmt = self
            .db
            .prepare("SELECT id, user_id, start_time, stop_time, is_saved, created_at, updated_at FROM timer_sessions WHERE user_id = ? AND is_saved = 0 ORDER BY created_at DESC LIMIT 1")
            .bind(&[user_id.into()])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        let result = stmt.all().await.map_err(|e| DbError::Query(format!("Failed to query: {:?}", e)))?;
        let rows = result.results::<serde_json::Value>().map_err(|e| DbError::Query(format!("Failed to parse: {:?}", e)))?;

        match rows.into_iter().next() {
            Some(row) => Ok(Some(self.parse_timer_session(&row)?)),
            None => Ok(None),
        }
    }

    /// Mark timer session as saved and record reading_log + laps.
    pub async fn save_timer_session(
        &self,
        session_id: &str,
        user_id: &str,
        isbn: u64,
        first_page: u16,
        last_page: u16,
        rating: Option<u8>,
        laps: Vec<Lap>,
    ) -> Result<(String, u64), DbError> {
        // Fetch the session
        let session = self.get_timer_session(session_id, user_id).await?;
        if session.is_saved {
            return Err(DbError::Query("Session already saved".to_string()));
        }

        // Compute duration from server timestamps
        let start = chrono::DateTime::parse_from_rfc3339(&session.start_time)
            .map_err(|e| DbError::Query(format!("Invalid start_time: {:?}", e)))?;

        let end_time_str = session.stop_time.as_deref().unwrap_or(&session.updated_at);
        let end = chrono::DateTime::parse_from_rfc3339(end_time_str)
            .map_err(|e| DbError::Query(format!("Invalid stop/updated_at: {:?}", e)))?;

        let server_duration_sec = (end.signed_duration_since(start)).num_seconds().max(0) as u64;

        // Build ReadingLog
        let reading_log = ReadingLog {
            id: None,
            isbn,
            created_at: session.start_time.clone(),
            session_duration_sec: server_duration_sec,
            page: [first_page, last_page],
            rating,
        };

        let log_id = self.add_reading_log_with_user(reading_log, user_id).await?;

        // Insert laps
        for lap in laps {
            let lap_id = lap.id.clone().unwrap_or_else(|| ulid::Ulid::new().to_string());
            let created_at = lap.created_at.clone();

            let stmt = self
                .db
                .prepare("INSERT INTO laps (id, reading_log_id, elapsed_ms, note, ref_page, created_at) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(&[
                    lap_id.into(),
                    log_id.clone().into(),
                    lap.elapsed_ms.to_string().into(),
                    lap.note.unwrap_or_default().into(),
                    lap.ref_page.map(|p| p.to_string()).unwrap_or_default().into(),
                    created_at.into(),
                ])
                .map_err(|e| DbError::Query(format!("Failed to bind lap: {:?}", e)))?;

            stmt.run().await.map_err(|e| DbError::Query(format!("Failed to insert lap: {:?}", e)))?;
        }

        // Mark session as saved
        let now = Utc::now().to_rfc3339();
        let stmt = self
            .db
            .prepare("UPDATE timer_sessions SET is_saved = 1, updated_at = ? WHERE id = ?")
            .bind(&[now.into(), session_id.into()])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        stmt.run().await.map_err(|e| DbError::Query(format!("Failed to mark session saved: {:?}", e)))?;

        Ok((log_id, server_duration_sec))
    }

    /// Reset (delete) the current unsaved timer session for the user.
    pub async fn reset_timer_session(&self, user_id: &str) -> Result<(), DbError> {
        let stmt = self
            .db
            .prepare("DELETE FROM timer_sessions WHERE user_id = ? AND is_saved = 0")
            .bind(&[user_id.into()])
            .map_err(|e| DbError::Query(format!("Failed to bind: {:?}", e)))?;

        stmt.run().await.map_err(|e| DbError::Query(format!("Failed to delete timer_sessions: {:?}", e)))?;

        Ok(())
    }

    // Helper: parse a timer_sessions row
    fn parse_timer_session(&self, row: &serde_json::Value) -> Result<crate::models::TimerSession, DbError> {
        let get_str = |key: &str| -> Result<String, DbError> {
            row.get(key)
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .ok_or_else(|| DbError::Query(format!("Missing field: {}", key)))
        };

        Ok(crate::models::TimerSession {
            id: get_str("id")?,
            user_id: get_str("user_id")?,
            start_time: get_str("start_time")?,
            stop_time: row.get("stop_time").and_then(|v| v.as_str()).map(|s| s.to_string()),
            is_saved: row.get("is_saved").and_then(|v| v.as_i64()).unwrap_or(0) != 0,
            created_at: get_str("created_at")?,
            updated_at: get_str("updated_at")?,
        })
    }
}
