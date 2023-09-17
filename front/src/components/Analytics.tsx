import React, { useState } from 'react';
import Graph from './Graph';
import Statistics from './Statistics';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"

function Analytics() {
    const day0 = new Date(2000, 1, 1);
    const today = new Date();
    const [term, setTerm] = useState([day0, today]);
    const setTermStart = (d: Date) => {
        setTerm([d, term[1]]);
    }
    const setTermEnd = (d: Date) => {
        setTerm([term[0], d]);
    }

    return (
        <div className='Analytics'>
            <p className='SetTerm'>
                <DatePicker
                    id='term-start'
                    dateFormat='yyyy/MM/dd'
                    selected={term[0]}
                    name='term-start'
                    onChange={d => { setTermStart(d || day0) }}
                />
                から
                <DatePicker
                    id='term-end'
                    dateFormat='yyyy/MM/dd'
                    selected={term[1]}
                    name='term-end'
                    onChange={d => { setTermEnd(d || today) }}
                />
                まで
            </p>
            <Graph term={term} />
            <Statistics term={term} />
        </div>
    );
}

export default Analytics;