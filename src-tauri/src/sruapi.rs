use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct SruApiQuery {
	pub operation: String,
	pub query: String,
	pub start_record: Option<u32>,
	pub maximum_records: Option<u32>,
	pub record_packing: Option<String>,
	pub record_schema: Option<String>,
}

impl SruApiQuery {
	pub fn new(query: String) -> Self {
		SruApiQuery {
			operation: "searchRetrieve".to_string(),
			query,
			start_record: Some(1),
			maximum_records: Some(5),
            record_packing: Some("xml".to_string()),
            record_schema: Some("dcndl".to_string()),
        }
    }
    pub fn to_query_params(&self) -> String {
        let mut params = vec![
            format!("operation={}", self.operation),
            format!("query={}", self.query),
        ];
        if let Some(start) = self.start_record {
            params.push(format!("startRecord={}", start));
        }
        if let Some(max) = self.maximum_records {
            params.push(format!("maximumRecords={}", max));
        }
        if let Some(ref packing) = self.record_packing {
            params.push(format!("recordPacking={}", packing));
        }
        if let Some(ref schema) = self.record_schema {
            params.push(format!("recordSchema={}", schema));
        }
        params.join("&")
    }
}