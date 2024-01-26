use std::path::PathBuf;
use std::sync::Mutex;

use tauri::async_runtime::block_on;

use crate::data_struct::{Books, Record};

use surrealdb::engine::local::{Db, Mem};
use surrealdb::Surreal;

pub struct Library {
    db: Mutex<Surreal<Db>>,
}

impl Library {
    // 一回だけ実行する
    // jsonを読み込んでstructに包んで返す
    pub fn load(path: &PathBuf) -> Library {
        let db = block_on(async { Surreal::new::<Mem>(()).await.unwrap() });
        block_on(async {
            db.use_ns("namespace").use_db("database").await.unwrap();

            let books = Books::load(path);

            for b in books {
                let _: Option<Record> = db.create(("book", &b.attr.isbn)).content(b).await.unwrap();
            }
        });
        Library { db: Mutex::new(db) }
    }

    // on-memのDBをjsonに保存する。
    pub fn save(&self, path: &PathBuf) {
        let db = self.db.lock().unwrap();
        let books: Vec<Record> = block_on(async {
            db.query("select * from book")
                .await
                .unwrap()
                .take(0)
                .unwrap()
        });
        let books = Books::from(books);
        books.save(path);
    }

    // 新しいデータを追加する。
    pub fn add(&self, new: Record) {
        let db = self.db.lock().unwrap();
        let select_task = async {
            db.query("select * from book were attr.isbn = ?")
                .bind(&new.attr.isbn)
                .await
                .unwrap()
                .take(0)
                .unwrap()
        };
        let mut rec: Vec<Record> = block_on(select_task);
        rec[0].merge(new);
        let update_task = async {
            let _: Option<Record> = db
                .update(("book", &rec[0].attr.isbn))
                .content(&rec[0])
                .await
                .unwrap();
        };
        block_on(update_task);
    }

    fn search_from_term(&self) {
        //未定
        todo!()
    }
}
