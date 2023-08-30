import React, { useState } from 'react';
import axios from "axios";

const endpoint = "https://www.googleapis.com/books/v1/volumes?q="

function Search() {
    const [isbn, setIsbn] = useState('');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [pageCount, setPageCount] = useState(0);
    const handleIsbnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isbn === "") {
            return;
        }
        const url = endpoint + isbn;
        axios.get(url).then((res) => {
            if (res.data.totalItems !== 0) {
                const bookData = res.data.items[0];
                setTitle(bookData.volumeInfo.title);
                setSubtitle(bookData.volumeInfo.subtitle);
                setPageCount(bookData.volumeInfo.pageCount);
            }
            else {
                setTitle("No Result");
                setSubtitle("");
                setPageCount(0);
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
                    <span>{title}<br />{subtitle}</span>
                </div>
                <div id='page-count'>
                    <span>ページ数: </span>
                    <span>{pageCount}</span>
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
                    placeholder={pageCount.toString()}
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