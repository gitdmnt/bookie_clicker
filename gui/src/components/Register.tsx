import React, { useState } from 'react';

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
    dateRange: Date[],
    memo: string,
}

function Register() {
    const [isbn, setIsbn] = useState('');
    const [bookAttr, setBookAttr] = useState<attr | null>(null);
    const [dateStart, setDateStart] = useState<Date | null>(null);
    const [dateEnd, setDateEnd] = useState<Date | null>(null);

    async function debug(msg: string) {
        await invoke("debug_print", { msg });
    }

    const handleIsbnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isbn === "") {
            return;
        }
        setBookAttr(await invoke("set_book_attr", { isbn }));
    };
    const showBookAttr = (bookAttr: attr | null) => {
        if (bookAttr != null) {
            return (<div>
                <ul>
                    <li>『{bookAttr.title + " " + bookAttr.subtitle}』</li>
                    <li>{bookAttr.authors.map(author => author + ", ")
                    } 著</li>
                    <li>{bookAttr.totalPageCount}ページ</li>
                </ul>
            </div>);
        }
    }
    const handleActivitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
    }
    return (
        <div className='Register'>
            <div className='Search'>
                <form onSubmit={handleIsbnSubmit}>
                    <p>本を検索</p>
                    <input
                        className='input'
                        id='isbn-window'
                        placeholder='ISBNを入力'
                        name='isbn'
                        type='text'
                        autoComplete='off'
                        onChange={(e) => setIsbn(e.target.value)}
                    />
                    <button className='Search-button button' type='submit'>検索</button>
                </form>
                {showBookAttr(bookAttr)}
                <div className='InputActivity'>
                    <form onSubmit={handleActivitySubmit}>
                        <input
                            className='input'
                            id='page-start'
                            placeholder='1'
                            name='start'
                            type='text'
                            autoComplete='off'
                            onChange={e => setDateStart(e.target.valueAsDate)}
                        />
                        <span>ページから</span>
                        <input
                            className='input'
                            id='page-end'
                            placeholder={bookAttr?.totalPageCount.toString()}
                            name='end'
                            type='text'
                            autoComplete='off'
                            onChange={e => setDateEnd(e.target.valueAsDate)}
                        />
                        <span>ページまで</span>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;