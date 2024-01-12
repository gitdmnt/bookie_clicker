import Bookdata from './Bookdata';
// import { invoke } from '@tauri-apps/api';
// import { Temporal } from 'temporal-polyfill';

function Booklist() {
    // const term = [Temporal.PlainDate.from("2024-01-01"), Temporal.PlainDate.from("2024-01-31")];
    // const books = (async () => { await invoke("fetch_record", { term }) })();
    const booklist = [];
    for (let i = 0; i < 10; i++) {
        booklist.push(
            <li key={"a"}>
                <Bookdata
                    title={"a"}
                    isbn={3939241084}
                    pageCount={100 + i}
                />
            </li>
        );
    }

    return (
        <div className='Booklist'>
            <p>読んだ本の一覧</p>
            <ul>
                {booklist}
            </ul>
        </div>
    );
}

export default Booklist;