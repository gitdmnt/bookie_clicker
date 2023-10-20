use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Config {
    pub debug: bool,
    pub mode: Mode,
    pub dir: String,
    pub shelf: String,
}

impl Config {
    pub fn new() -> Config {
        Config {
            debug: true,
            mode: Mode::Cli,
            dir: String::from("data/"),
            shelf: String::from("test_shelf.json"),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Mode {
    Cli,
    Gui,
}
