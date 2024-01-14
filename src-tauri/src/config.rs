use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub debug: bool,
    #[serde(rename = "dirPath")]
    pub dir_path: PathBuf,
}

impl Config {
    fn new() -> Config {
        Config {
            debug: false,
            dir_path: dirs::config_dir().unwrap().join(".bookie_clicker"),
        }
    }

    fn set_default(config_path: &PathBuf) -> Config {
        let mut file = fs::File::create(&config_path).unwrap();
        let default_config = Config::new();
        let json: String = serde_json::to_string(&default_config).unwrap();
        file.write_all(json.as_bytes()).unwrap();
        default_config
    }

    fn load(config_path: &PathBuf) -> Config {
        let str = match fs::read_to_string(config_path) {
            Ok(str) => str,
            Err(_) => {
                // dirを作る
                fs::create_dir_all(config_path.parent().unwrap()).unwrap_or_else(|why| {
                    println!("! {:?}", why.kind());
                });
                String::new()
            }
        };
        let c = match serde_json::from_str(&str) {
            Ok(config) => config,
            Err(_) => Self::set_default(config_path),
        };
        c
    }
}

#[derive(Debug)]
pub struct ConfigManager {
    config: Mutex<Config>,
}

impl ConfigManager {
    pub fn new() -> ConfigManager {
        ConfigManager {
            config: Mutex::new(Config::new()),
        }
    }
    fn from(c: Config) -> ConfigManager {
        ConfigManager {
            config: Mutex::from(c),
        }
    }

    pub fn set(&self, c: Config) {
        let mut old = self.get();
        old.debug = c.debug;
        old.dir_path = c.dir_path;
    }

    pub fn edit(&self, c: ConfigManager) {
        let mut old = self.get();
        let c = c.get();
        old.debug = c.debug;
        old.dir_path = PathBuf::from(c.dir_path.to_owned());
    }
    pub fn get(&self) -> MutexGuard<'_, Config> {
        self.config.lock().unwrap()
    }
    pub fn load(config_path: &PathBuf) -> ConfigManager {
        println!("Loading config");
        let c = Self::from(Config::load(config_path));
        println!("Loaded: {:?}", c.get());
        c
    }

    pub fn fetch(&self) -> Config {
        let dir_path: PathBuf = dirs::config_dir().unwrap().join(".bookie_clicker");
        let config_path = dir_path.join("config.json");
        Config::load(&config_path)
    }
}
