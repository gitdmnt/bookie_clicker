use crate::ports::{Filter, FilterValue, QueryBuilder};

#[test]
fn test_query_builder_new() {
    let query = QueryBuilder::new();
    assert_eq!(query.filters.len(), 0);
    assert_eq!(query.limit, None);
    assert_eq!(query.offset, None);
}

#[test]
fn test_query_builder_with_eq_filter() {
    let query = QueryBuilder::new()
        .filter(Filter::Eq("isbn".to_string(), FilterValue::String("9784873119038".to_string())));
    
    assert_eq!(query.filters.len(), 1);
    match &query.filters[0] {
        Filter::Eq(field, value) => {
            assert_eq!(field, "isbn");
            match value {
                FilterValue::String(s) => assert_eq!(s, "9784873119038"),
                _ => panic!("Expected String value"),
            }
        }
        _ => panic!("Expected Eq filter"),
    }
}

#[test]
fn test_query_builder_with_gte_filter() {
    let query = QueryBuilder::new()
        .filter(Filter::Gte("duration_ms".to_string(), FilterValue::U64(1000)));
    
    assert_eq!(query.filters.len(), 1);
    match &query.filters[0] {
        Filter::Gte(field, value) => {
            assert_eq!(field, "duration_ms");
            match value {
                FilterValue::U64(n) => assert_eq!(*n, 1000),
                _ => panic!("Expected U64 value"),
            }
        }
        _ => panic!("Expected Gte filter"),
    }
}

#[test]
fn test_query_builder_with_lte_filter() {
    let query = QueryBuilder::new()
        .filter(Filter::Lte("duration_ms".to_string(), FilterValue::U64(5000)));
    
    assert_eq!(query.filters.len(), 1);
    match &query.filters[0] {
        Filter::Lte(field, value) => {
            assert_eq!(field, "duration_ms");
            match value {
                FilterValue::U64(n) => assert_eq!(*n, 5000),
                _ => panic!("Expected U64 value"),
            }
        }
        _ => panic!("Expected Lte filter"),
    }
}

#[test]
fn test_query_builder_with_contains_filter() {
    let query = QueryBuilder::new()
        .filter(Filter::Contains("title".to_string(), "Rust".to_string()));
    
    assert_eq!(query.filters.len(), 1);
    match &query.filters[0] {
        Filter::Contains(field, value) => {
            assert_eq!(field, "title");
            assert_eq!(value, "Rust");
        }
        _ => panic!("Expected Contains filter"),
    }
}

#[test]
fn test_query_builder_multiple_filters() {
    let query = QueryBuilder::new()
        .filter(Filter::Eq("isbn".to_string(), FilterValue::String("9784873119038".to_string())))
        .filter(Filter::Gte("duration_ms".to_string(), FilterValue::U64(1000)));
    
    assert_eq!(query.filters.len(), 2);
}

#[test]
fn test_query_builder_with_limit() {
    let query = QueryBuilder::new()
        .limit(10);
    
    assert_eq!(query.limit, Some(10));
}

#[test]
fn test_query_builder_with_offset() {
    let query = QueryBuilder::new()
        .offset(20);
    
    assert_eq!(query.offset, Some(20));
}

#[test]
fn test_query_builder_chaining() {
    let query = QueryBuilder::new()
        .filter(Filter::Eq("isbn".to_string(), FilterValue::String("9784873119038".to_string())))
        .filter(Filter::Gte("duration_ms".to_string(), FilterValue::U64(1000)))
        .limit(5)
        .offset(10);
    
    assert_eq!(query.filters.len(), 2);
    assert_eq!(query.limit, Some(5));
    assert_eq!(query.offset, Some(10));
}

#[test]
fn test_filter_value_string() {
    let value = FilterValue::String("test".to_string());
    match value {
        FilterValue::String(s) => assert_eq!(s, "test"),
        _ => panic!("Expected String value"),
    }
}

#[test]
fn test_filter_value_u64() {
    let value = FilterValue::U64(42);
    match value {
        FilterValue::U64(n) => assert_eq!(n, 42),
        _ => panic!("Expected U64 value"),
    }
}

#[test]
fn test_filter_value_u32() {
    let value = FilterValue::U32(100);
    match value {
        FilterValue::U32(n) => assert_eq!(n, 100),
        _ => panic!("Expected U32 value"),
    }
}

#[test]
fn test_filter_value_u16() {
    let value = FilterValue::U16(255);
    match value {
        FilterValue::U16(n) => assert_eq!(n, 255),
        _ => panic!("Expected U16 value"),
    }
}

#[test]
fn test_filter_value_u8() {
    let value = FilterValue::U8(10);
    match value {
        FilterValue::U8(n) => assert_eq!(n, 10),
        _ => panic!("Expected U8 value"),
    }
}

