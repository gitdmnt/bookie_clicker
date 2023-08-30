import React, { useState } from 'react';
import Search from './Search';
import ShowBookData from './ShowBookData';
import InputBookData from './InputBookData';

function Register() {
    const [bookData, setBookData] = useState({ title: "", subtitle: "", pageCount: 0 });
    const [readPages, setReadPages] = useState([1, 0]);

    const sendBookData = (e: React.FormEvent) => {
        e.preventDefault();
        if (readPages[1] === 0) {
            readPages[1] = bookData.pageCount;
        }
        alert(readPages[0].toString() + ", " + readPages[1].toString());
    };
    return (
        <div className='Register'>
            <Search handleBookData={setBookData} />
            <ShowBookData bookData={bookData} />
            <InputBookData bookData={bookData} readPages={[readPages, setReadPages]} />
            <div className='SendBookData'>
                <button className='Register-button button' onClick={(e => sendBookData(e))}>読了</button>
            </div>
        </div>
    );
}

export default Register;