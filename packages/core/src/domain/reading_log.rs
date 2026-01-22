use serde::{Deserialize, Serialize};

/// ReadingLog entity - represents a single reading session
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReadingLog {
    pub id: Option<String>,
    pub isbn: u64,
    pub created_at: String,
    pub session_duration_sec: u64,
    pub page: [u16; 2], // [start_page, end_page]
    pub rating: Option<u8>,
}

impl ReadingLog {
    /// Create a new reading log
    pub fn new(isbn: u64, created_at: String, session_duration_sec: u64, page: [u16; 2]) -> Self {
        Self {
            id: None,
            isbn,
            created_at,
            session_duration_sec,
            page,
            rating: None,
        }
    }

    /// Validate reading log data
    pub fn validate(&self) -> Result<(), String> {
        if self.isbn == 0 {
            return Err("ISBN cannot be zero".to_string());
        }
        if self.page[0] > self.page[1] {
            return Err("Start page cannot be greater than end page".to_string());
        }
        if let Some(rating) = self.rating {
            if rating > 5 {
                return Err("Rating must be between 0 and 5".to_string());
            }
        }
        Ok(())
    }

    /// Calculate pages read
    pub fn pages_read(&self) -> u16 {
        self.page[1].saturating_sub(self.page[0])
    }
}

/// Lap entity - represents a checkpoint during reading
#[derive(Clone, Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Lap {
    pub id: Option<String>,
    pub elapsed_ms: u64,
    pub note: Option<String>,
    pub ref_page: Option<u32>,
    pub created_at: String,
}

impl Lap {
    pub fn new(elapsed_ms: u64, created_at: String) -> Self {
        Self {
            id: None,
            elapsed_ms,
            note: None,
            ref_page: None,
            created_at,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reading_log_creation() {
        let log = ReadingLog::new(
            9784873119038,
            "2024-01-01T10:00:00Z".to_string(),
            3600,
            [1, 50],
        );

        assert_eq!(log.isbn, 9784873119038);
        assert_eq!(log.session_duration_sec, 3600);
        assert!(log.validate().is_ok());
    }

    #[test]
    fn test_reading_log_pages_read() {
        let log = ReadingLog::new(
            9784873119038,
            "2024-01-01T10:00:00Z".to_string(),
            3600,
            [10, 50],
        );

        assert_eq!(log.pages_read(), 40);
    }

    #[test]
    fn test_reading_log_validation_invalid_pages() {
        let log = ReadingLog::new(
            9784873119038,
            "2024-01-01T10:00:00Z".to_string(),
            3600,
            [50, 10], // Invalid: start > end
        );

        assert!(log.validate().is_err());
    }

    #[test]
    fn test_lap_creation() {
        let lap = Lap::new(1800000, "2024-01-01T10:30:00Z".to_string());
        assert_eq!(lap.elapsed_ms, 1800000);
    }
}
