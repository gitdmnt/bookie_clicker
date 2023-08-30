import React, { useState } from 'react';

export default function InputBookData(props: any) {
    const bookData = props.bookData;
    const readPages = props.readPages[0];
    const setReadPages = props.readPages[1];
    const handleReadPages = (e: React.ChangeEvent<HTMLInputElement>, b: ("start" | "end")) => {
        const page = Number(e.target.value);
        if (Number.isNaN(page)) {
            return;
        }
        if (b === "start") {
            setReadPages([page, readPages[1]]);
        }
        else {
            setReadPages([readPages[0], page]);
        }

    };
    return (
        <div className='InputBookData'>
            <div className='InputPageCount'>
                <input
                    className='input'
                    id='page-start'
                    placeholder='1'
                    name='start'
                    type='text'
                    autoComplete='off'
                    onChange={e => handleReadPages(e, "start")}
                />
                <span>ページから</span>
                <input
                    className='input'
                    id='page-end'
                    placeholder={bookData.pageCount.toString()}
                    name='end'
                    type='text'
                    autoComplete='off'
                    onChange={e => handleReadPages(e, "end")}
                />
                <span>ページまで</span>
            </div>
        </div>
    );
};