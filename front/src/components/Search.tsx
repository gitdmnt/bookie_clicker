import React from 'react';

function Search() {
    return (
        <div className='Search'>
            <form>
                <p>本を検索</p>
                <input
                    className='input'
                    id='isbn-window'
                    placeholder='ISBNを入力'
                    name='isbn'
                    type='text'
                    autoComplete='off'
                />
                <button className='Search-button button'>検索</button>
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