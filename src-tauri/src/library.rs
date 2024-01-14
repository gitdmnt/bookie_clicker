use std::path::PathBuf;
use std::sync::Mutex;

use tauri::async_runtime::block_on;

use crate::data_struct::{Books, Record};

use surrealdb::engine::local::{Db, Mem};
use surrealdb::opt::auth::Root;
use surrealdb::Surreal;

pub struct Library {
    db: Mutex<Surreal<Db>>,
}

impl Library {
    pub fn load(path: &PathBuf) -> Library {
        let db = block_on(async { Surreal::new::<Mem>(()).await.unwrap() });

        block_on(async {
            db.use_ns("namespace").use_db("database").await.unwrap();

            let books = Books::load(path);

            for b in books {
                let _: Option<Record> = db.create(("book", &b.attr.isbn)).content(b).await.unwrap();
            }
        });
        /*
            let q: Option<Record> = block_on(async {
                db.query("select * from book where attr.totalPageCount>300;")
                    .await
            })
            .unwrap()
            .take(0)
            .unwrap();
            println!("{:?}", q.unwrap());
        */
        // 一回だけ実行する
        // jsonを読み込んでstructに包んで返す
        Library { db: Mutex::new(db) }
    }

    fn save(&self, path: &PathBuf) {
        // on-memのDBをjsonに保存する。
        todo!()
    }

    fn search(&self) {
        //未定
        todo!()
    }
}
