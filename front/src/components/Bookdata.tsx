import React from "react";

type prop = {
    title: string,
    isbn: number,
    pageCount: number,
}

function Bookdata(props: prop) {
    return (
        <div className="Bookdata">
            <span>{props.title}</span>
            <span>/</span>
            <span>{props.isbn}</span>
            <span>/</span>
            <span>{props.pageCount}</span>
        </div>
    );
}

export default Bookdata;