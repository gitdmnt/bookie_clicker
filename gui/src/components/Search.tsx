import React, { useState } from 'react';
import { invoke } from "@tauri-apps/api/tauri";

type attr = {
    isbn: string,
    title: string,
    subtitle: string,
    authors: string[],
    pageCount: number,
};

type prop = {
    handleBookData: React.Dispatch<React.SetStateAction<attr>>,
}

export default function Search(props: prop) {
    const [isbn, setIsbn] = useState('');
    const [bookAttr, setBookAttr] = useState('');
    const setBookData = props.handleBookData;

    async function getBookAttr(isbn: string) {
        setBookAttr(await invoke("set_book_attr", { isbn }));
    }

    async function debug(msg: string) {
        await invoke("debug_print", { msg });
    }

    const handleIsbnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isbn === "") {
            return;
        }
        getBookAttr(isbn);
        debug(bookAttr);
    };
    return (
        <div className='Seach'>
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
        </div>
    );
}