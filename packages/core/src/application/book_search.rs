use crate::domain::isbn::parse_isbn;
use crate::domain::Book;
use crate::ports::{Clock, HttpClient};

use quick_xml::events::Event;
use quick_xml::name::QName;
use quick_xml::reader::Reader;

/// Application service: Search for books by ISBN using NDL API
pub async fn search_book_by_isbn<C: HttpClient, K: Clock>(
    isbn: &str,
    client: &C,
    clock: &K,
) -> Result<Vec<Book>, String> {
    // parse_isbn returns canonical ISBN-13 as u64
    let isbn_num = parse_isbn(isbn)?;
    let isbn_13 = isbn_num.to_string();

    let try_query = async |query_isbn: &str| -> Result<Vec<Book>, String> {
        let url = format!(
            "https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&recordSchema=dcndl&recordPacking=xml&query=isbn%3d{}",
            query_isbn
        );
        dbg!("Querying NDL API URL: {}", &url);
        let text = client.get_text(&url).await?;
        let books = parse_response(&text, clock)?;
        Ok(books)
    };

    // try ISBN-13 first
    let mut books = try_query(&isbn_13).await?;
    if !books.is_empty() {
        // ensure ISBN and image_url are set if parser didn't provide them
        for b in books.iter_mut() {
            if b.isbn == 0 {
                b.isbn = isbn_num;
            }
            if b.image_url.is_empty() && b.isbn != 0 {
                b.image_url = format!("https://ndlsearch.ndl.go.jp/thumbnail/{}.jpg", b.isbn);
            }
        }
        return Ok(books);
    }

    // fallback: try ISBN-10 (last 10 chars of ISBN-13)
    if isbn_13.len() >= 13 {
        if let Some(isbn_10) = isbn_13.get(3..13) {
            let mut books_10 = try_query(isbn_10).await?;
            for b in books_10.iter_mut() {
                if b.isbn == 0 {
                    b.isbn = isbn_num;
                }
                if b.image_url.is_empty() && b.isbn != 0 {
                    b.image_url = format!("https://ndlsearch.ndl.go.jp/thumbnail/{}.jpg", b.isbn);
                }
            }
            return Ok(books_10);
        }
    }

    Ok(Vec::new())
}

fn parse_response(response: &str, clock: &impl Clock) -> Result<Vec<Book>, String> {
    let mut reader = Reader::from_str(response);
    reader.config_mut().trim_text(true);

    let mut books = Vec::new();

    loop {
        match reader.read_event() {
            Err(e) => {
                return Err(format!(
                    "Error parsing XML at position {}: {}",
                    reader.error_position(),
                    e
                ))
            }
            Ok(Event::Start(e)) if e.name().as_ref() == b"record" => {
                books.push(parse_record(&mut reader, clock)?);
            }
            Ok(Event::Eof) => break,

            _ => (),
        }
    }

    Ok(books)
}

fn text_of_element(reader: &mut Reader<&[u8]>, name: &[u8]) -> Result<String, String> {
    // read_text returns a Cow<str> — convert to String
    reader
        .read_text(QName(name))
        .map(|cow| cow.to_string())
        .map_err(|e| {
            format!(
                "Error reading text for {:?}: {}",
                String::from_utf8_lossy(name),
                e
            )
        })
}

fn parse_inner_value(reader: &mut Reader<&[u8]>, name: &[u8]) -> Result<String, String> {
    let mut buf = Vec::new();
    loop {
        match reader.read_event_into(&mut buf) {
            Err(e) => return Err(format!("Error parsing rdf:value: {}", e)),
            Ok(Event::Start(e)) if e.name().as_ref() == name => {
                let val = reader
                    .read_text(e.name())
                    .map(|cow| cow.to_string())
                    .unwrap_or_default();
                // consume until end of parent handled by caller
                return Ok(val);
            }
            Ok(Event::End(_)) | Ok(Event::Eof) => break,
            _ => (),
        }
        buf.clear();
    }
    Ok(String::new())
}

fn parse_inner_values(reader: &mut Reader<&[u8]>, name: &[u8]) -> Result<Vec<String>, String> {
    let mut buf = Vec::new();
    let mut values = Vec::new();
    loop {
        match reader.read_event_into(&mut buf) {
            Err(e) => return Err(format!("Error parsing rdf:value: {}", e)),
            Ok(Event::Start(e)) if e.name().as_ref() == name => {
                let val = reader
                    .read_text(e.name())
                    .map(|cow| cow.to_string())
                    .unwrap_or_default();
                values.push(val);
            }
            Ok(Event::End(_)) | Ok(Event::Eof) => break,
            _ => (),
        }
        buf.clear();
    }
    Ok(values)
}

fn extract_digits(s: &str) -> String {
    s.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn matches_tag(name: &[u8], tags: &[&[u8]]) -> bool {
    tags.contains(&name)
}

fn normalize_author(raw: &str) -> String {
    let s = raw.trim();
    // remove isolated 4-digit year tokens
    let tokens: Vec<&str> = s
        .split_whitespace()
        .filter(|t| !(t.len() == 4 && t.chars().all(|c| c.is_ascii_digit())))
        .collect();
    let joined = tokens.join(" ");
    if joined.contains(',') {
        let parts: Vec<&str> = joined
            .split(',')
            .map(|p| p.trim())
            .filter(|p| !p.is_empty())
            .collect();
        if parts.len() == 2 {
            return format!("{} {}", parts[1], parts[0]);
        }
    }
    joined
}

fn parse_record(reader: &mut Reader<&[u8]>, clock: &impl Clock) -> Result<Book, String> {
    let mut buf = Vec::new();
    let mut title = String::new();
    let mut series_title: Option<String> = None;
    let mut authors: Vec<String> = Vec::new();
    let mut publisher = String::new();
    let mut year: u32 = 0;
    let mut page_count: u32 = 0;
    let mut isbn_str = String::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Err(e) => {
                return Err(format!(
                    "Error parsing XML at position {}: {}",
                    reader.error_position(),
                    e
                ))
            }
            Ok(Event::Start(e)) => {
                let name = e.name().as_ref().to_vec();
                if name.as_slice() == b"dc:title" {
                    title = parse_inner_value(reader, b"rdf:value")?;
                } else if name.as_slice() == b"dcndl:seriesTitle" {
                    let s = parse_inner_value(reader, b"rdf:value")?;
                    if !s.is_empty() {
                        series_title = Some(s);
                    }
                } else if name.as_slice() == b"dcterms:creator" {
                    // prefer explicit foaf:name entries, fallback to inner text
                    let name = parse_inner_values(reader, b"foaf:name")?;
                    authors.extend(name);
                } else if matches_tag(name.as_slice(), &[b"dcterms:publisher", b"dc:publisher"]) {
                    publisher = parse_inner_value(reader, b"foaf:name")?;
                    if publisher.is_empty() {
                        publisher = text_of_element(reader, name.as_slice())?;
                    }
                } else if matches_tag(name.as_slice(), &[b"dcterms:issued", b"dc:date"]) {
                    let raw = text_of_element(reader, name.as_slice())?;
                    if let Some(num) = raw.split_whitespace().next() {
                        if let Ok(y) = num.trim().parse::<u32>() {
                            year = y;
                        }
                    }
                } else if name.as_slice() == b"dcterms:extent" {
                    let raw = text_of_element(reader, name.as_slice())?;
                    let first_part = raw.split(';').next().unwrap_or("");
                    let digits_str = extract_digits(first_part);
                    page_count = digits_str.parse::<u32>().unwrap_or(0);
                } else if matches_tag(name.as_slice(), &[b"dc:identifier", b"dcterms:identifier"]) {
                    let raw = text_of_element(reader, name.as_slice())?;
                    let digits = extract_digits(&raw);
                    if digits.len() >= 10 && digits.len() <= 13 && digits.len() >= isbn_str.len() {
                        isbn_str = digits;
                    }
                } else {
                    // ignore
                }
            }
            Ok(Event::End(e)) if e.name().as_ref() == b"record" => break,
            Ok(Event::Eof) => break,
            _ => (),
        }
        buf.clear();
    }

    // normalize authors
    authors = authors
        .into_iter()
        .map(|a| normalize_author(&a))
        .filter(|s| !s.is_empty())
        .collect();

    // Normalize isbn to ISBN-13 numeric if possible
    let isbn_digits = extract_digits(&isbn_str);
    let mut isbn_num: u64 = 0;
    if !isbn_digits.is_empty() {
        // If 10-digit, convert to 13 by prepending 978
        let isbn_13 = if isbn_digits.len() == 10 {
            format!("978{}", isbn_digits)
        } else {
            isbn_digits.clone()
        };
        isbn_num = isbn_13.parse::<u64>().unwrap_or(0);
    }

    // image_url
    let image_url = if isbn_num != 0 {
        // use isbn_num as string (already 13 ideally)
        let isbn_s = isbn_num.to_string();
        format!("https://ndlsearch.ndl.go.jp/thumbnail/{}.jpg", isbn_s)
    } else {
        String::new()
    };

    Ok(Book {
        isbn: isbn_num,
        title,
        series_title,
        authors,
        publisher,
        year,
        page_count,
        image_url,
        created_at: clock.now_rfc3339(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestClock;
    impl Clock for TestClock {
        fn now_rfc3339(&self) -> String {
            "1970-01-01T00:00:00Z".to_string()
        }
    }

    #[test]
    fn parse_response_parses_basic_record() {
        let xml = r#"
<searchRetrieveResponse>
  <records>
    <record>
      <recordData>
        <rdf:RDF>
          <dcndl:BibResource>
            <dc:title><rdf:Description><rdf:value>サンプルタイトル</rdf:value></rdf:Description></dc:title>
            <dcndl:seriesTitle><rdf:Description><rdf:value>シリーズ</rdf:value></rdf:Description></dcndl:seriesTitle>
            <dcterms:creator><rdf:Description><foaf:Agent><foaf:name>山田, 太郎</foaf:name></foaf:Agent></rdf:Description></dcterms:creator>
            <dcterms:publisher><foaf:Agent><foaf:name>出版社名</foaf:name></foaf:Agent></dcterms:publisher>
            <dcterms:issued>2001</dcterms:issued>
            <dcterms:extent>203p ; 26cm</dcterms:extent>
            <dc:identifier>ISBN 4102130225</dc:identifier>
          </dcndl:BibResource>
        </rdf:RDF>
      </recordData>
    </record>
  </records>
</searchRetrieveResponse>
"#;
        let clock = TestClock;
        let books = parse_response(xml, &clock).unwrap();
        assert_eq!(books.len(), 1);
        let b = &books[0];
        assert_eq!(b.title, "サンプルタイトル");
        assert_eq!(b.series_title.as_deref(), Some("シリーズ"));
        assert_eq!(b.authors.len(), 1);
        assert_eq!(b.authors[0], "太郎 山田");
        assert_eq!(b.publisher, "出版社名");
        assert_eq!(b.year, 2001);
        assert_eq!(b.page_count, 203);
        // ISBN 4102130225 -> ISBN-13 9784102130223 (starts with 978)
        assert!(b.isbn.to_string().starts_with("978"));
        assert_eq!(b.created_at, "1970-01-01T00:00:00Z");
    }

    #[test]
    fn normalize_author_various() {
        assert_eq!(normalize_author("山田, 太郎"), "太郎 山田");
        assert_eq!(normalize_author("山田 太郎 2001"), "山田 太郎");
        assert_eq!(normalize_author("Some Org"), "Some Org");
    }
}
