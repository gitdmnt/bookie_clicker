use serde::{Deserialize, Serialize};

/// Book entity - core domain model
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Book {
    pub isbn: u64, // Primary Key
    pub title: String,
    pub series_title: Option<String>,
    pub authors: Vec<String>,
    pub publisher: String,
    pub year: u32,
    pub page_count: u32,
    pub image_url: String,
    pub created_at: String,
}

impl Book {
    /// Create a new Book with required fields
    pub fn new(
        isbn: u64,
        title: String,
        authors: Vec<String>,
        publisher: String,
        year: u32,
        page_count: u32,
        image_url: String,
        created_at: String,
    ) -> Self {
        Self {
            isbn,
            title,
            series_title: None,
            authors,
            publisher,
            year,
            page_count,
            image_url,
            created_at,
        }
    }

    /// Validate book data
    pub fn validate(&self) -> Result<(), String> {
        if self.isbn == 0 {
            return Err("ISBN cannot be zero".to_string());
        }
        if self.title.trim().is_empty() {
            return Err("Title cannot be empty".to_string());
        }
        if self.authors.is_empty() {
            return Err("Book must have at least one author".to_string());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_book_creation() {
        let book = Book::new(
            9784873119038,
            "プログラミングRust".to_string(),
            vec!["Jim Blandy".to_string()],
            "オライリー・ジャパン".to_string(),
            2018,
            600,
            "https://example.com/image.jpg".to_string(),
            "2024-01-01T00:00:00Z".to_string(),
        );

        assert_eq!(book.isbn, 9784873119038);
        assert_eq!(book.title, "プログラミングRust");
        assert!(book.validate().is_ok());
    }

    #[test]
    fn test_book_validation_empty_title() {
        let mut book = Book::new(
            9784873119038,
            "".to_string(),
            vec!["Author".to_string()],
            "Publisher".to_string(),
            2024,
            100,
            "".to_string(),
            "2024-01-01T00:00:00Z".to_string(),
        );

        assert!(book.validate().is_err());
    }

    #[test]
    fn test_book_validation_no_authors() {
        let book = Book::new(
            9784873119038,
            "Title".to_string(),
            vec![],
            "Publisher".to_string(),
            2024,
            100,
            "".to_string(),
            "2024-01-01T00:00:00Z".to_string(),
        );

        assert!(book.validate().is_err());
    }
}
