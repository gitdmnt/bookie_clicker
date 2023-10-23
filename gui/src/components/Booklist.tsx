import React from 'react';
import Bookdata from './Bookdata';

function Booklist() {
    const booklist = [];
    for (let i = 0; i < 10; i++) {
        booklist.push(
            <li>
                <Bookdata
                    title={"a"}
                    isbn={3939241084}
                    pageCount={100 + i}
                />
            </li>
        );
    }

    return (
        <div className='Booklist'>
            <p>読んだ本の一覧</p>
            <ul>
                {booklist}
            </ul>
        </div>
    );
}

export default Booklist;