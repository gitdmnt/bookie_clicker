import React, { useState } from 'react';

function Search() {
    const [isbn, setIsbn] = useState('');
    const handleIsbnSubmit = (e: React.FormEvent) => {
        e.preventDefault();

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
                <p id='title'>タイトル</p>
                <p id='page-count'>ページ数</p>
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
                    placeholder='9999'
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