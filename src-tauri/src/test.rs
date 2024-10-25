mod bookshelf_search {
    use super::super::*;
    use bookshelf::{Activity, BookInfo, Bookshelf, Container, Key, Order, Query};

    #[test]
    fn empty() {
        let bookshelf = Bookshelf::new();

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Rating,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 0);
    }

    #[test]
    fn no_match() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(0, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2022-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Rating,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 0);
    }

    #[test]
    fn multiple_match() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(0, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "b".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2022-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Rating,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
    }

    #[test]
    fn multiple_activity() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(0, [0, 5], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let activity = Activity::new(0, [0, 10], "2022-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Rating,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 1);
    }

    #[test]
    fn order_asc() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(0, [0, 5], "2021-01-01".to_string(), "読了".to_string(), 4);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "b".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2022-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Asc,
            Key::Rating,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].isbn(), 1);
        assert_eq!(result[1].isbn(), 0);
    }

    #[test]
    fn key_date() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(0, [0, 5], "2022-01-01".to_string(), "読了".to_string(), 4);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "b".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Date,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].isbn(), 1);
        assert_eq!(result[1].isbn(), 0);
    }

    #[test]
    fn key_title() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "b".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(0, [0, 5], "2022-01-01".to_string(), "読了".to_string(), 4);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "a".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Title,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].isbn(), 1);
        assert_eq!(result[1].isbn(), 0);
    }

    #[test]
    fn key_page_desc() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            20,
        );
        let activity = Activity::new(0, [0, 5], "2022-01-01".to_string(), "読了".to_string(), 4);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "b".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Page,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].isbn(), 1);
        assert_eq!(result[1].isbn(), 0);
    }

    #[test]
    fn key_page_asc() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            20,
        );
        let activity = Activity::new(0, [0, 5], "2022-01-01".to_string(), "読了".to_string(), 4);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "b".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Asc,
            Key::Page,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].isbn(), 0);
        assert_eq!(result[1].isbn(), 1);
    }

    #[test]
    fn multiple_date_desc() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            20,
        );
        let activity = Activity::new(0, [0, 5], "2023-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let activity = Activity::new(0, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "b".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2022-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Desc,
            Key::Date,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].isbn(), 0);
    }

    #[test]
    fn multiple_date_asc() {
        let bookshelf = Bookshelf::new();

        let book_info = BookInfo::new(
            0,
            "a".to_string(),
            "1".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            20,
        );
        let activity = Activity::new(0, [0, 5], "2023-01-01".to_string(), "読了".to_string(), 4);
        bookshelf.add(book_info.clone(), activity.clone());

        let activity = Activity::new(0, [0, 10], "2021-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let book_info = BookInfo::new(
            1,
            "b".to_string(),
            "2".to_string(),
            vec!["Uda".to_string()],
            "https://example.com".to_string(),
            10,
        );
        let activity = Activity::new(1, [0, 10], "2022-01-01".to_string(), "読了".to_string(), 5);
        bookshelf.add(book_info.clone(), activity.clone());

        let query = Query::new(
            ["2021-01-01".to_string(), "2024-01-01".to_string()],
            [1, 5],
            Order::Asc,
            Key::Date,
        );

        let result = bookshelf.search(query);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].isbn(), 0);

        println!("{:?}", result);
    }
}
