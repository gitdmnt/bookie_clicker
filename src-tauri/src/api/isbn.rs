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

fn parse_isbn(input: &str) -> Result<u64, String> {
    let isbn = input.replace("-", "").replace(" ", "");
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
