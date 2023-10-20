use back::cli::{
    config::{Config, Mode},
    fetch_book_attr, input, write_to_file, BookAttr, BookLib, Error, Progress, ReadStatus, Status,
};
use chrono::NaiveDate;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let cfg: Config = Config::load().unwrap();
    match cfg.mode() {
        Mode::Cli => main_cli(cfg).await,
        Mode::Gui => Ok(()),
        _ => Ok(()),
    }
}

async fn main_cli(cfg: Config) -> Result<(), Error> {
    let mut buf = BookLib::new();

    // データ入力
    loop {
        let isbn = match input::<String>("Input isbn") {
            Some(s) => s,
            None => break,
        };

        let mut book_details = if cfg.debug {
            let status = Status::new();
            BookAttr::from(
                String::from("udachan books vol.1"),
                isbn,
                String::from("udachan"),
                99,
                status,
            )
        } else {
            fetch_book_attr(isbn).await?
        };

        println!("{} 『{}』", book_details.author(), book_details.title());

        let read_status = match input::<u8>("Select read status\n1: Read\n2: Reading\n3: Unread") {
            Some(s) => match s {
                1 => ReadStatus::Read,
                2 => ReadStatus::Reading,
                _ => ReadStatus::Unread,
            },
            None => break,
        };
        let (date_start, date_end) = if read_status == ReadStatus::Unread {
            (
                NaiveDate::parse_from_str("2002-09-22", "%Y-%m-%d").unwrap(),
                NaiveDate::parse_from_str("2002-09-22", "%Y-%m-%d").unwrap(),
            )
        } else {
            (
                match input::<NaiveDate>("Input date you started reading as \"%Y-%m-%d\"") {
                    Some(s) => s,
                    None => break,
                },
                match input::<NaiveDate>("Input date you finished reading as \"%Y-%m-%d\"") {
                    Some(s) => s,
                    None => break,
                },
            )
        };
        let (page_start, page_end) = if read_status == ReadStatus::Read {
            (1, book_details.page_max())
        } else if read_status == ReadStatus::Reading {
            (
                match input::<u32>("Input page you started reading") {
                    Some(s) => s,
                    None => break,
                },
                match input::<u32>("Input page you finished reading") {
                    Some(s) => s,
                    None => break,
                },
            )
        } else {
            (0, 0)
        };
        let progress = Progress::from(
            book_details.page_max(),
            page_start,
            page_end,
            date_start,
            date_end,
        );
        let flag_combined = progress.flag().copy();
        let status = Status::from(
            read_status,
            page_end - page_start + 1,
            vec![progress],
            flag_combined,
        );
        book_details.set_status(status);
        buf.push(book_details);
    }
    if let Err(e) = write_to_file(&cfg, buf) {
        println!("{}", e);
    };
    Ok(())
}
