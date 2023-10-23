import React from "react";

function Statistics(props: any) {
    const term = props.term;
    const booklist = [];
    return (
        <div className="Statistics">
            ここに{term[0].toLocaleDateString()}から{term[1].toLocaleDateString()}までの統計が入る
        </div>
    );
}

export default Statistics;