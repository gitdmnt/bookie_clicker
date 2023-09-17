import React, { useState } from 'react';
import Search from './Search';
import ShowBookData from './ShowBookData';
import InputBookData from './InputBookData';
import axios from 'axios';

function Register() {
    const URL = "http://localhost:3001/api/registerbook";

    const [bookData, setBookData] = useState({ isbn: "", title: "", subtitle: "", pageCount: 0 });
    const [readPages, setReadPages] = useState([1, 0]);

    const sendBookData = (e: React.FormEvent) => {
        e.preventDefault();
        if (readPages[1] === 0) {
            readPages[1] = bookData.pageCount;
        } alert(bookData.title + readPages[0].toString() + ", " + readPages[1].toString());
        //なんかエラー吐く　今日はここでおしまい
        axios.post(URL, {
            user: 0,
            isbn: "9784588010590",
        }).catch((e) => { alert(e); });

    };

    return (
        <div className='Register'>
            <Search handleBookData={setBookData} />
            <ShowBookData bookData={bookData} />
            <InputBookData bookData={bookData} readPages={setReadPages} />
            <div className='SendBookData'>
                <button className='Register-button button' onClick={(e => sendBookData(e))}>読了</button>
            </div>
        </div>
    );
}

export default Register;