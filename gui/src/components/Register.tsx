import React, { useState } from 'react';
import Search from './Search';
import ShowBookData from './ShowBookData';
import InputBookData from './InputBookData';

function Register() {
    const URL = "http://localhost:3001/api/registerbook";

    const [bookData, setBookData] = useState({ isbn: "", title: "", subtitle: "", authors: [""], pageCount: 0 });
    const [readPages, setReadPages] = useState([1, 0]);

    function sendBookData(e: any) {

    }

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