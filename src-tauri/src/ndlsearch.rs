use super::bookshelf::BookInfo;
use crate::sruapi::SruApiQuery;

use anyhow::{anyhow, Result};
use minidom::{Element, NSChoice};
use quick_xml::{events::Event, Reader};
use regex::Regex;
use reqwest::get;
use tauri::async_runtime::block_on;

pub async fn fetch(isbn: String) -> Result<Vec<BookInfo>> {
    let isbn = validate_isbn(isbn);
    let sru_query = SruApiQuery::new(format!("isbn%3d{}", isbn));
    let query_params = sru_query.to_query_params();
    let url = format!("https://ndlsearch.ndl.go.jp/api/sru?{}", query_params);
    let response = get(url).await?.text().await?;
    let book_info_container = parse_response(response)?;
    Ok(book_info_container)
}

fn validate_isbn(query: String) -> Result<u64, anyhow::Error> {
    let mut isbn = query
        .replace("-", "");
    if isbn.len() != 13 {
        isbn = format!("978{}", isbn);
    }
    isbn.parse::<u64>().map_err(|e| anyhow!("Invalid ISBN: {}", e))
}

fn parse_response(response: String) -> Result<Vec<BookInfo>> {
    let records = trim_response(response)?;
    let book_info_container = contain_book_info(records)?;
    Ok(book_info_container)
}

fn trim_response(response: String) -> Result<Vec<String>> {
    let mut reader = Reader::from_str(&response);
    reader.config_mut().trim_text(true);

    let mut records = Vec::new();

    loop {
        match reader.read_event() {
            Ok(Event::Start(e)) if e.name().as_ref() == b"record" => {
                let end = e.to_end().into_owned();
                let record = reader.read_text(end.name())?.as_ref().to_owned();
                let record = format!("<record>{}</record>", record);
                records.push(record);
            }
            Ok(Event::Eof) => break,
            _ => {}
        }
    }
    Ok(records)
}

fn contain_book_info(records: Vec<String>) -> Result<Vec<BookInfo>> {
    let mut book_info_container = Vec::new();

    for record in records {
        if let Ok(b) = record_to_book_info(record) {
            book_info_container.push(b);
        }
    }

    Ok(book_info_container)
}

fn record_to_book_info(record: String) -> Result<BookInfo> {
    let record = format!(
        "{}{}{}",
        &record[0..7],
        " xmlns=\"https://dummy.com\"",
        &record[7..]
    );
    let mut record: Element = Element::from_reader(record.as_bytes())?;
    let mut record = record
        .remove_child("recordData", NSChoice::Any)
        .ok_or(anyhow!(""))?
        .remove_child("RDF", NSChoice::Any)
        .ok_or(anyhow!(""))?
        .remove_child("BibResource", NSChoice::Any)
        .ok_or(anyhow!(""))?;
    let isbn = record
        .children()
        .find_map(|child| {
            if child.name() == "identifier" && child.attr("rdf:datatype") == Some("http://ndl.go.jp/dcndl/terms/ISBN") {
                validate_isbn(child.text().to_string()).ok()
            } else {
                None
            }
        })
        .ok_or(anyhow!("ISBN not found"))?;
    let title = record
        .get_child("title", "http://purl.org/dc/elements/1.1/")
        .ok_or(anyhow!("Title not found"))?
        .get_child("Description", NSChoice::Any)
        .ok_or(anyhow!("Title not found"))?
        .get_child("value", NSChoice::Any)
        .ok_or(anyhow!("Title not found"))?
        .text();
    let subtitle = match record.get_child("seriesTitle", NSChoice::Any) {
        Some(s) => s
            .get_child("Description", NSChoice::Any)
            .ok_or(anyhow!(""))?
            .get_child("value", NSChoice::Any)
            .ok_or(anyhow!(""))?
            .text(),
        None => "".to_owned(),
    };

    let authors = {
        let mut a = vec![];
        while let Some(e) = record.remove_child("creator", "http://purl.org/dc/terms/") {
            a.push(
                e.get_child("Agent", NSChoice::Any)
                    .ok_or(anyhow!(""))?
                    .get_child("name", NSChoice::Any)
                    .ok_or(anyhow!(""))?
                    .text(),
            );
        }
        a
    };

    let total_page_count = {
        let r = Regex::new(r"^\d+").unwrap();
        let s = record
            .get_child("extent", NSChoice::Any)
            .ok_or(anyhow!(""))?
            .text();
        match r.captures(&s) {
            Some(c) => c.get(0).unwrap().as_str().parse::<u32>().unwrap(),
            None => 0,
        }
    };
    let book_info = BookInfo::new(
        isbn,
        title,
        subtitle,
        authors,
        format!("https://ndlsearch.ndl.go.jp/thumbnail/{}.jpg", isbn),
        total_page_count,
    );
    Ok(book_info)
}

#[test]
fn isbn_validation() {
    assert_eq!(validate_isbn("978-0-00-000000-0".to_owned()).unwrap(), 9780000000000);
    assert_eq!(validate_isbn("0-00-000000-0".to_owned()).unwrap(), 9780000000000);
}

#[test]
fn fetching() {
    let fetch = async { fetch("9784621089712".to_owned()).await };
    let book_info = block_on(fetch).unwrap();
    assert_eq!(book_info.len(), 2);
    assert_eq!(book_info[0].title, "線形代数");
    assert_eq!(book_info[0].subtitle, "東京大学工学教程 ; 基礎系数学");
    assert_eq!(book_info[0].authors.len(), 3);
    assert_eq!(book_info[0].total_page_count, 299);
}

#[test]
fn test_record_to_book_info() {
    let record = r#"<record xmlns="https://dummy.com">
  <recordData>
    <rdf:RDF xmlns:rdf="a" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcndl="d" xmlns:foaf="e">
      <dcndl:BibResource>
        <dc:title><rdf:Description><rdf:value>title</rdf:value></rdf:Description></dc:title>
        <dcndl:seriesTitle><rdf:Description><rdf:value>subtitle</rdf:value></rdf:Description></dcndl:seriesTitle>
        <dcterms:creator><foaf:Agent><foaf:name>dummy</foaf:name></foaf:Agent></dcterms:creator>
        <dcterms:creator><foaf:Agent><foaf:name>dummy2</foaf:name></foaf:Agent></dcterms:creator>
        <dcterms:extent>10p ; 999cm</dcterms:extent>    
        <dcterms:identifier rdf:datatype="http://ndl.go.jp/dcndl/terms/ISBN">9780000000000</dcterms:identifier>
      </dcndl:BibResource>
    </rdf:RDF>
  </recordData>
</record>"#
        .to_owned();
    let book_info = record_to_book_info(record).unwrap();
    assert_eq!(book_info.isbn, 9780000000000);
    assert_eq!(book_info.title, "title");
    assert_eq!(book_info.subtitle, "subtitle");
    assert_eq!(book_info.authors.len(), 2);
    assert_eq!(book_info.total_page_count, 10);
}

#[test]
fn xmltest() {
    let xml = r#"<a xmlns="a">
  <b:tag xmlns:b="c">
    text
  </b:tag>
</a>"#;

    let xml: Element = Element::from_reader(xml.as_bytes()).unwrap();
    let a = xml.get_child("tag", "").unwrap().text();
    assert_eq!(a, "text");
}
