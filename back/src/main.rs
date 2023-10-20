/// 問題点
/// - booklibのmerge時にread_page_numを計算してない
/// - booklibのmerge時にflag_combinedを計算してない
/// - booklibのmerge時にread_statusを計算してない
use back::cli::{
    config::{Config, Mode},
    main_cli, Error,
};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let cfg: Config = Config::load().unwrap();
    match cfg.mode {
        Mode::Cli => main_cli(cfg).await,
        Mode::Gui => Ok(()),
        _ => Ok(()),
    }
}
