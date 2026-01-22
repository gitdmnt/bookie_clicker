use serde::{Deserialize, Serialize};

/// ISBN value object - ensures ISBN validity
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Isbn(u64);

impl Isbn {
    /// Create a new ISBN from a u64 (must be valid ISBN-13)
    pub fn new(value: u64) -> Result<Self, String> {
        let isbn_str = value.to_string();
        validate_isbn13(&isbn_str)?;
        Ok(Isbn(value))
    }

    /// Parse ISBN from string (accepts ISBN-10 or ISBN-13)
    pub fn parse(input: &str) -> Result<Self, String> {
        let value = parse_isbn(input)?;
        Ok(Isbn(value))
    }

    /// Get the underlying u64 value
    pub fn value(&self) -> u64 {
        self.0
    }

    /// Get the ISBN as a string
    pub fn as_string(&self) -> String {
        self.0.to_string()
    }
}

impl std::fmt::Display for Isbn {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

fn validate_isbn10(isbn10: &str) -> Result<(), String> {
    if isbn10.len() != 10 {
        return Err("invalid length".to_string());
    }
    let mut sum = 0;
    for (i, c) in isbn10.chars().enumerate() {
        let digit = if c == 'X' && i == 9 {
            10
        } else {
            match c.to_digit(10) {
                Some(d) => d,
                None => return Err("invalid character in ISBN-10".to_string()),
            }
        };
        sum += digit * (10 - i as u32);
    }
    if sum % 11 == 0 {
        Ok(())
    } else {
        Err("invalid ISBN-10 checksum".to_string())
    }
}

fn convert_isbn10_to_isbn13(isbn10: String) -> Result<u64, String> {
    let isbn_body = isbn10[..9]
        .parse::<u64>()
        .map_err(|_| "invalid ISBN-10 format".to_string())?;
    let mut isbn13 = 978_00000_00000 + isbn_body * 10; // prepend 978

    // calculate checksum for ISBN-13
    let mut sum = 0;
    let mut temp_isbn = isbn13;
    for i in 0..13 {
        let digit = temp_isbn % 10;
        let weight = if (i % 2) == 0 { 1 } else { 3 };
        sum += digit * weight;
        temp_isbn /= 10;
    }
    let checksum = (10 - (sum % 10)) % 10;
    isbn13 += checksum;
    Ok(isbn13)
}

fn validate_isbn13(isbn13: &str) -> Result<(), String> {
    if isbn13.len() != 13 || !isbn13.chars().all(|c| c.is_ascii_digit()) {
        return Err("invalid length or non-digit characters".to_string());
    }
    let mut sum = 0;
    for (i, c) in isbn13.chars().enumerate() {
        let digit = c
            .to_digit(10)
            .ok_or("invalid character in ISBN-13".to_string())?;
        let weight = if (i % 2) == 0 { 1 } else { 3 };
        sum += digit * weight;
    }
    if sum % 10 == 0 {
        Ok(())
    } else {
        Err("invalid ISBN-13 checksum".to_string())
    }
}

/// Parse ISBN string and return canonical ISBN-13 as u64
/// Accepts both ISBN-10 and ISBN-13 formats
pub fn parse_isbn(input: &str) -> Result<u64, String> {
    let isbn = input.replace('-', "").replace(' ', "");
    if isbn.len() == 10 {
        validate_isbn10(&isbn)?;
        convert_isbn10_to_isbn13(isbn)
    } else if isbn.len() == 13 {
        validate_isbn13(&isbn)?;
        isbn.parse::<u64>()
            .map_err(|_| "invalid ISBN-13 format".to_string())
    } else {
        Err("ISBN must be either 10 or 13 digits long".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_isbn_value_object() {
        let isbn = Isbn::parse("9784873119038").unwrap();
        assert_eq!(isbn.value(), 9784873119038);
        assert_eq!(isbn.as_string(), "9784873119038");
    }

    #[test]
    fn test_isbn_from_isbn10() {
        let isbn = Isbn::parse("4-10-213022-5").unwrap();
        assert_eq!(isbn.value(), 9784102130223);
    }

    #[test]
    fn validate_isbn10_valid() {
        assert!(validate_isbn10("4101092052").is_ok());
    }

    #[test]
    fn validate_isbn10_with_x_valid() {
        assert!(validate_isbn10("410113202X").is_ok());
    }

    #[test]
    fn validate_isbn10_invalid_length_or_chars() {
        assert!(validate_isbn10("1234").is_err());
        assert!(validate_isbn10("ABCDEFGHIJ").is_err());
        assert!(validate_isbn10("X23456789X").is_err());
    }

    #[test]
    fn convert_isbn10_to_isbn13_valid() {
        assert_eq!(
            convert_isbn10_to_isbn13("4102130225".to_string()).unwrap(),
            9_784_102_130_223u64
        );
    }

    #[test]
    fn convert_isbn10_to_isbn13_invalid_format() {
        assert!(convert_isbn10_to_isbn13("12345678X9".to_string()).is_err());
    }

    #[test]
    fn validate_isbn13_valid_and_invalid() {
        assert!(validate_isbn13("9784102130223").is_ok());
        assert!(validate_isbn13("9784102130228").is_err());
        assert!(validate_isbn13("978410213022").is_err());
        assert!(validate_isbn13("97841021A0223").is_err());
    }

    #[test]
    fn parse_isbn_from_isbn10_and_isbn13() {
        assert_eq!(parse_isbn("4-10-213022-5").unwrap(), 9_784_102_130_223u64);
        assert_eq!(parse_isbn(" 4 10 213022 5 ").unwrap(), 9_784_102_130_223u64);
        assert_eq!(parse_isbn("9784102130223").unwrap(), 9_784_102_130_223u64);
    }

    #[test]
    fn parse_isbn_validates_isbn10_with_x() {
        let parsed = parse_isbn("410113202X").unwrap();
        assert!(validate_isbn13(&parsed.to_string()).is_ok());
    }

    #[test]
    fn parse_isbn_invalid_length() {
        assert!(parse_isbn("123").is_err());
    }
}
