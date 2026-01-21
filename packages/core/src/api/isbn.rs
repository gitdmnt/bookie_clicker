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
    fn validate_isbn10_valid() {
        // 新潮文庫 新編銀河鉄道の夜
        assert!(validate_isbn10("4101092052").is_ok());
    }

    #[test]
    fn validate_isbn10_with_x_valid() {
        // 新潮文庫 香華
        assert!(validate_isbn10("410113202X").is_ok());
    }

    #[test]
    fn validate_isbn10_invalid_length_or_chars() {
        assert!(validate_isbn10("1234").is_err());
        assert!(validate_isbn10("ABCDEFGHIJ").is_err());
        // 'X' only allowed as last character
        assert!(validate_isbn10("X23456789X").is_err());
    }

    #[test]
    fn convert_isbn10_to_isbn13_valid() {
        // 新潮文庫 劇場
        // Known mapping: ISBN-10 4102130225 -> ISBN-13 9784102130223
        assert_eq!(
            convert_isbn10_to_isbn13("4102130225".to_string()).unwrap(),
            9_784_102_130_223u64
        );
    }

    #[test]
    fn convert_isbn10_to_isbn13_invalid_format() {
        // non-digit in the first 9 chars should fail parsing
        assert!(convert_isbn10_to_isbn13("12345678X9".to_string()).is_err());
    }

    #[test]
    fn validate_isbn13_valid_and_invalid() {
        assert!(validate_isbn13("9784102130223").is_ok());
        // wrong checksum
        assert!(validate_isbn13("9784102130228").is_err());
        // invalid chars and length
        assert!(validate_isbn13("978410213022").is_err());
        assert!(validate_isbn13("97841021A0223").is_err());
    }

    #[test]
    fn parse_isbn_from_isbn10_and_isbn13() {
        // from ISBN-10 with hyphens
        assert_eq!(parse_isbn("4-10-213022-5").unwrap(), 9_784_102_130_223u64);
        // from ISBN-10 with spaces
        assert_eq!(parse_isbn(" 4 10 213022 5 ").unwrap(), 9_784_102_130_223u64);
        // from ISBN-13 directly
        assert_eq!(parse_isbn("9784102130223").unwrap(), 9_784_102_130_223u64);
    }

    #[test]
    fn parse_isbn_validates_isbn10_with_x() {
        let parsed = parse_isbn("410113202X").unwrap();
        // ensure the produced ISBN-13 is valid
        assert!(validate_isbn13(&parsed.to_string()).is_ok());
    }

    #[test]
    fn parse_isbn_invalid_length() {
        assert!(parse_isbn("123").is_err());
    }
}
