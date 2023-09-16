import React, { useState } from 'react';
import axios from "axios";

type data = {
    isbn: string,
    title: string,
    subtitle: string,
    pageCount: number,
}

const endpoint = "https://www.googleapis.com/books/v1/volumes?q="

export default function Search(props: any) {
    const [isbn, setIsbn] = useState('');
    const setBookData = props.handleBookData;
    const handleIsbnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isbn === "") {
            return;
        }
        const url = endpoint + isbn;
        axios.get(url).then((res) => {
            if (res.data.totalItems !== 0) {
                const item = res.data.items[0].volumeInfo;
                const bookData: data = { isbn: isbn, title: item.title, subtitle: item.subtitle, pageCount: item.pageCount }
                setBookData(bookData);
            }
            else {
                const bookData: data = { isbn: isbn, title: "No Result", subtitle: "", pageCount: 0 }
                setBookData(bookData);
            }
        });

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