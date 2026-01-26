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

    pub async fn add_book_with_user(&self, book: Book, user_id: &str) -> Result<(), DbError> {
        let authors_json = serde_json::to_string(&book.authors)
            .map_err(|e| DbError::Query(format!("Failed to serialize authors: {}", e)))?;

        let created_at = book
            .created_at
            .clone()
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| Utc::now().to_rfc3339());

        let stmt = self
            .db
            .prepare("INSERT INTO books (isbn, title, series_title, authors, publisher, year, page_count, image_url, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&[
                book.isbn.to_string().into(),
                book.title.into(),
                book.series_title.unwrap_or_default().into(),
                authors_json.into(),
                book.publisher.into(),
                book.year.to_string().into(),
                book.page_count.to_string().into(),
                book.image_url.into(),
                created_at.into(),
                user_id.into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind parameters: {:?}", e)))?;

        stmt.run().await.map_err(|e| {
            if e.to_string().contains("UNIQUE") {
                DbError::UniqueConstraint(format!("Book with ISBN {} already exists", book.isbn))
            } else {
                DbError::Query(format!("Failed to insert book: {:?}", e))
            }
        })?;

        Ok(())
    }

    pub async fn add_reading_log_with_user(
        &self,
        log: ReadingLog,
        user_id: &str,
    ) -> Result<String, DbError> {
        let id = log
            .id
            .clone()
            .unwrap_or_else(|| ulid::Ulid::new().to_string());

        let stmt = self
            .db
            .prepare("INSERT INTO reading_logs (id, isbn, created_at, session_duration_sec, page_start, page_end, rating, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&[
                id.clone().into(),
                log.isbn.to_string().into(),
                log.created_at.into(),
                log.session_duration_sec.to_string().into(),
                log.page[0].to_string().into(),
                log.page[1].to_string().into(),
                log.rating.map(|r| r.to_string()).unwrap_or_default().into(),
                user_id.into(),
            ])
            .map_err(|e| DbError::Query(format!("Failed to bind parameters: {:?}", e)))?;

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
}

impl D1Database {
    pub async fn find_books(&self, query: QueryBuilder) -> Result<Vec<Book>, DbError> {
        let (where_clause, params) = self.build_where_clause(&query);
        let limit_offset = self.apply_limit_offset(&query);
        let sql = format!("SELECT * FROM books{}{}", where_clause, limit_offset);

        let mut stmt = self.db.prepare(&sql);

        for param in params {
            stmt = stmt
                .bind(&[param.into()])
                .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
        }

        let result = stmt
            .all()
            .await
            .map_err(|e| DbError::Query(format!("Failed to query books: {:?}", e)))?;

        let books: Vec<Book> = result
            .results::<serde_json::Value>()
            .map_err(|e| DbError::Query(format!("Failed to parse results: {:?}", e)))?
            .into_iter()
            .filter_map(|row| {
                Some(Book {
                    isbn: row.get("isbn")?.as_u64()?,
                    title: row.get("title")?.as_str()?.to_string(),
                    series_title: row
                        .get("series_title")
                        .and_then(|v| v.as_str())
                        .and_then(|s| {
                            if s.is_empty() {
                                None
                            } else {
                                Some(s.to_string())
                            }
                        }),
                    authors: serde_json::from_str(row.get("authors")?.as_str()?).ok()?,
                    publisher: row.get("publisher")?.as_str()?.to_string(),
                    year: row.get("year")?.as_u64()? as u32,
                    page_count: row.get("page_count")?.as_u64()? as u32,
                    image_url: row.get("image_url")?.as_str()?.to_string(),
                    created_at: row
                        .get("created_at")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string())
                        .filter(|s| !s.is_empty()),
                })
            })
            .collect();

        Ok(books)
    }

    pub async fn delete_books(&self, query: QueryBuilder) -> Result<(), DbError> {
        let (where_clause, params) = self.build_where_clause(&query);
        let sql = format!("DELETE FROM books{}", where_clause);

        let mut stmt = self.db.prepare(&sql);

        for param in params {
            stmt = stmt
                .bind(&[param.into()])
                .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
        }

        stmt.run()
            .await
            .map_err(|e| DbError::Query(format!("Failed to delete books: {:?}", e)))?;

        Ok(())
    }

    pub async fn find_reading_logs(&self, query: QueryBuilder) -> Result<Vec<ReadingLog>, DbError> {
        let (where_clause, params) = self.build_where_clause(&query);
        let limit_offset = self.apply_limit_offset(&query);
        let sql = format!("SELECT * FROM reading_logs{}{}", where_clause, limit_offset);

        let mut stmt = self.db.prepare(&sql);

        for param in params {
            stmt = stmt
                .bind(&[param.into()])
                .map_err(|e| DbError::Query(format!("Failed to bind parameter: {:?}", e)))?;
        }

        let result = stmt
            .all()
            .await
            .map_err(|e| DbError::Query(format!("Failed to query reading logs: {:?}", e)))?;

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
}
