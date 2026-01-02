/// Sub-module defining the Table enum for database table representation.
/// This enum is needed to specify the table type when wrapping the return value of Query in an Element.
/// Currently, it includes Book and ReadingLog tables.
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub enum Table {
    Book,
    ReadingLog,
}
