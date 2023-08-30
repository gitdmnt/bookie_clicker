import React, { useState } from 'react';
import axios from "axios";

type data = {
    title: string,
    subtitle: string,
    pageCount: number,
}

const endpoint = "https://www.googleapis.com/books/v1/volumes?q="

function Search() {
    const [isbn, setIsbn] = useState('');
    const [bookData, setBookData] = useState({ title: "", subtitle: "", pageCount: 0 });
    const handleIsbnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isbn === "") {
            return;
        }
        const url = endpoint + isbn;
        axios.get(url).then((res) => {
            if (res.data.totalItems !== 0) {
                const item = res.data.items[0].volumeInfo;
                const bookData: data = { title: item.title, subtitle: item.subtitle, pageCount: item.pageCount }
                setBookData(bookData);
            }
            else {
                const bookData: data = { title: "No Result", subtitle: "", pageCount: 0 }
                setBookData(bookData);
            }
        });

    };
    return (
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
                <button
                    className='Search-button button'
                    type='submit'
                >
                    検索
                </button>
            </form>
            <div className='Bookdata'>
                <div id='title'>
                    <span>タイトル: </span>
                    <span>{bookData.title}<br />{bookData.subtitle}</span>
                </div>
                <div id='page-count'>
                    <span>ページ数: </span>
                    <span>{bookData.pageCount}</span>
                </div>
                <input
                    className='input'
                    id='page-start'
                    placeholder='1'
                    name='start'
                    type='text'
                    autoComplete='off'
                />
                <span>ページから</span>
                <input
                    className='input'
                    id='page-end'
                    placeholder={bookData.pageCount.toString()}
                    name='end'
                    type='text'
                    autoComplete='off'
                />
                <span>ページまで</span>
                <button className='Register-button button'>読了</button>
            </div>
        </div>

    );
}

export default Search;