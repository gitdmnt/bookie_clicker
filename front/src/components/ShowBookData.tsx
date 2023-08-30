import React from "react";

export default function ShowBookData(props: any) {
    const bookData = props.bookData;
    return (
        <div className='ShowBookData'>
            <div id='title'>
                <span>タイトル: </span>
                <span>{bookData.title}<br />{bookData.subtitle}</span>
            </div>
            <div id='page-count'>
                <span>ページ数: </span>
                <span>{bookData.pageCount}</span>
            </div>
        </div>
    );
}; 