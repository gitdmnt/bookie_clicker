use crate::db::table::Table;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Query {
    // メタデータ
    pub element_type: Table,
    user: Option<u64>,

    // Book の場合
    isbn: Option<u64>, // Primary Key
    title: Option<String>,
    series_title: Option<String>,
    author: Option<String>,
    publisher: Option<String>,

    // ReadingLog の場合
    id: Option<String>,
    date_from: Option<u32>,
    date_to: Option<u32>,
}

impl std::fmt::Display for Query {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let query = format!("SELECT * FROM {}", &self.table())
            + match &self.condition() {
                Some(v) => v,
                None => "",
            }
            + ";";

        write!(f, "{}", query)?;
        Ok(())
    }
}

impl Query {
    pub fn to_delete(&self) -> String {
        format!("DELETE {}", &self.table())
            + match &self.condition() {
                Some(v) => v,
                None => "",
            }
            + ";"
    }
    fn table(&self) -> String {
        match &self.element_type {
            Table::Book => "books".to_owned(),
            Table::ReadingLog => "reading_logs".to_owned(),
        }
    }

    // クエリの条件を" WHERE ..." の形で返す (先頭1文字スペース)
    fn condition(&self) -> Option<String> {
        let query = [
            self.user.map(|v| format!("user = {}", v)),
            self.isbn.map(|v| format!("isbn = {}", v)),
            self.title.as_ref().map(|v| format!("title = {}", v)),
            self.series_title
                .as_ref()
                .map(|v| format!("series_title = {}", v)),
            self.author.as_ref().map(|v| format!("author = {}", v)),
            self.publisher
                .as_ref()
                .map(|v| format!("publisher = {}", v)),
            self.date_from.map(|v| format!("date >= {}", v)),
            self.date_to.map(|v| format!("date <= {}", v)),
            self.id.as_ref().map(|v| format!("id = {}", v)),
        ]
        .into_iter()
        .flatten()
        .collect::<Vec<String>>()
        .join(" AND ");

        if query.is_empty() {
            None
        } else {
            Some(" WHERE".to_string() + " " + &query)
        }
    }
    fn for_all_books() -> Query {
        Query {
            element_type: Table::Book,
            user: None,
            date_from: None,
            date_to: None,
            isbn: None,
            title: None,
            series_title: None,
            author: None,
            publisher: None,
            id: None,
        }
    }
    fn for_all_logs() -> Query {
        Query {
            element_type: Table::ReadingLog,
            ..Query::for_all_books()
        }
    }
}
