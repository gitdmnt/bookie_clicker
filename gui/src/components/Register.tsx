import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"
import { Temporal } from 'temporal-polyfill';

import { invoke } from "@tauri-apps/api/tauri";

type attr = {
    isbn: string,
    title: string,
    subtitle: string,
    authors: string[],
    imageUrl: string,
    totalPageCount: number,
};

type activity = {
    readStatus: "Read" | "Reading" | "Unread",
    pageRange: number[],
    term: Temporal.PlainDate[],
    memo: string,
}

function Register() {
    const [bookAttr, setBookAttr] = useState<attr>({ isbn: "", title: "", subtitle: "", authors: [""], imageUrl: "", totalPageCount: 0 });
    const [activity, setActivity] = useState<activity>({ readStatus: "Unread", pageRange: [0, 0], term: [Temporal.PlainDate.from("1970-01-01"), Temporal.PlainDate.from("1970-01-01")], memo: "" });

    const [termStart, setTermStart] = useState<Date | null>(new Date());
    const [termEnd, setTermEnd] = useState<Date | null>(new Date());

    const handleIsbnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const target = e.target as typeof e.target & {
            isbn: { value: string };
        };
        const isbn = target.isbn.value;
        if (isbn === "") {
            setBookAttr({ isbn: "", title: "", subtitle: "", authors: [], imageUrl: "", totalPageCount: 0 })
        }
        else {
            setBookAttr(await invoke("set_book_attr", { isbn }));
        }
    };
    const handleActivitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const target = e.target as typeof e.target & {
            readStatus: { value: "Read" | "Reading" | "Unread" },
            pageStart: { value: string },
            pageEnd: { value: string },
            memo: { value: string },
        }
        const pageRange = [Number(target.pageStart.value), Number(target.pageEnd.value)];
        const term = [Temporal.PlainDate.from((termStart ?? new Date()).toISOString().slice(0, 10)), Temporal.PlainDate.from((termEnd ?? new Date()).toISOString().slice(0, 10))];
        const activity: activity = { readStatus: target.readStatus.value, pageRange: pageRange, term: term, memo: target.memo.value };
        setActivity(activity);
        await invoke("set_record", { bookAttr, activity });
    };

    async function debug(msg: string) {
        await invoke("debug_print", { msg });
    }
    return (
        <div className='Register'>
            <div className='Search'>
                {/* ISBNを受け取り, 本のデータを検索。boolAttrにセットする*/}
                <form onSubmit={handleIsbnSubmit}>
                    <p>本を検索</p>
                    <input
                        className='input'
                        placeholder='ISBNを入力'
                        name='isbn'
                        type='text'
                        autoComplete='off'
                    />
                    <button className='Search-button button' type='submit'>検索</button>
                </form>
                <div className='BookAttribute'>
                    <ul>
                        <li>『{bookAttr.title + " " + bookAttr.subtitle}』</li>
                        <li>{bookAttr.authors.map(author => author + ", ")
                        } 著</li>
                        <li>{bookAttr.totalPageCount}ページ</li>
                    </ul>
                </div>
            </div>
            <div className='InputActivity'>
                {/* アクティビティを入力し、activityにセットする。 */}
                <form onSubmit={handleActivitySubmit}>
                    <div>
                        <input
                            className='readStatus-input'
                            type='radio'
                            name='readStatus'
                            id='read'
                            value={"Read"}
                        />
                        <label htmlFor='read'>読了</label>
                        <input
                            className='readStatus-input'
                            type='radio'
                            name='readStatus'
                            id='reading'
                            value={"Reading"}
                        />
                        <label htmlFor='reading'>読書中</label>
                        <input
                            className='readStatus-input'
                            type='radio'
                            name='readStatus'
                            id='unread'
                            value={"Unread"}
                        />
                        <label htmlFor='unread'>未読</label>
                    </div>
                    <input
                        className='page-input'
                        placeholder='1'
                        name='pageStart'
                        type='text'
                        autoComplete='off'
                    />
                    <span>ページから</span>
                    <input
                        className='page-input'
                        placeholder={bookAttr?.totalPageCount.toString()}
                        name='pageEnd'
                        type='text'
                        autoComplete='off'
                    />
                    <span>ページまで</span>
                    <div className='SetTerm'>
                        <DatePicker
                            id='term-start'
                            dateFormat='yyyy-MM-dd'
                            selected={termStart}
                            name='term-start'
                            onChange={(d) => { setTermStart(d) }}
                        />
                        から
                        <DatePicker
                            id='term-end'
                            dateFormat='yyyy-MM-dd'
                            selected={termEnd}
                            name='term-end'
                            onChange={(d) => { setTermEnd(d) }}
                        />
                        まで
                    </div>
                    <textarea name="memo"></textarea>
                    <button className='Register-button button' type='submit'>登録</button>
                </form>
                <div className='Activity'>
                    <ul>
                        <li>読了状態: {activity.readStatus}</li>
                        <li>{activity.pageRange[0]}ページから{activity.pageRange[1]}ページまで</li>
                        <li>{activity.term[0].toString()}から{activity.term[1].toString()}まで</li>
                        <li>コメント: {activity.memo}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Register;