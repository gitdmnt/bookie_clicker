
use dirs;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};

#[derive(Deserialize, Serialize)]
pub struct Config {
    pub bookshelf_path: Mutex<PathBuf>,
}

impl Config {
    fn new() -> Self {
        Self {
            bookshelf_path: Mutex::new(
                dirs::config_dir()
                    .unwrap()
                    .join("BookieClicker")
                    .join("bookshelf.json"),
            ),
        }
    }

    pub fn load() -> Self {
        let path = dirs::config_dir()
            .unwrap()
            .join("BookieClicker")
            .join("config.json");
        let s = match fs::read_to_string(&path) {
            Ok(s) => s,
            Err(_) => {
                fs::create_dir_all(&path.parent().unwrap()).unwrap();
                fs::File::create(&path).unwrap();
                "".to_string()
            }
        };
        let config = match serde_json::from_str(&s) {
            Ok(config) => config,
            Err(_) => Self::new(),
        };
        config
    }

    pub fn save(&self) {
        let s = serde_json::to_string(&self).unwrap();
        let path = dirs::config_dir()
            .unwrap()
            .join("BookieClicker")
            .join("config.json");

        fs::create_dir_all(&path.parent().unwrap()).unwrap();
        fs::File::create(&path).unwrap();
        fs::write(&path, s).unwrap();
    }

    pub fn set(&self, config: &Config) -> Result<String, String> {
        let new_path = config.bookshelf_path.lock().unwrap().clone();
        if new_path == PathBuf::new() {
            return Err("Path is blank".to_string());
        }

        let message = format!("Set path to {:?}", new_path);
        *self.bookshelf_path.lock().unwrap() = new_path;
        self.save();
        Ok(message)
    }
}
