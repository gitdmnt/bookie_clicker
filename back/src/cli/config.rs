use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{Error, Write};

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
    pub fn load() -> Result<Config, Error> {
        let path = "config.json";
        if let Err(e) = File::open(path) {
            println!("{}", e);
            let mut file = File::create(path)?;
            let new_cfg = serde_json::to_string(&Config::new())?;
            write!(file, "{}", new_cfg)?;
            file.flush()?;
        };
        let content = std::fs::read_to_string(path)?;
        let config: Config = match serde_json::from_str(&content) {
            Ok(b) => b,
            Err(e) => {
                println!("{}", e);
                println!("Loading default config");
                let cfg = Config::new();
                let mut file = File::create(path)?;
                let new_cfg = serde_json::to_string(&cfg)?;
                write!(file, "{}", new_cfg)?;
                file.flush()?;
                cfg
            }
        };
        Ok(config)
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Mode {
    Cli,
    Gui,
}
