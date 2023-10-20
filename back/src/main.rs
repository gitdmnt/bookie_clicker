use back::cli::{
    config::{Config, Mode},
    BookAttr, BookLib,
};

#[tokio::main]
async fn main() -> Result<(), String> {
    let cfg: Config = Config::load().unwrap();
    match cfg.mode() {
        Mode::Cli => main_cli(cfg).await,
        Mode::Gui => Ok(()),
        _ => Ok(()),
    }
}

async fn main_cli(cfg: Config) -> Result<(), String> {
    let mut buf = BookLib::new();

    // データ入力
    loop {
        let mut book_details = if cfg.debug {
            BookAttr::debug_book_attr()?
        } else {
            BookAttr::fetch_book_attr().await?
        };
        book_details.print_attr();
        match book_details.set_status() {
            Ok(_) => (),
            Err(e) => {
                println!("{}", e);
                break;
            }
        };

        buf.push(book_details);
    }
    if let Err(e) = buf.write(&cfg) {
        println!("{}", e);
    };
    Ok(())
}
