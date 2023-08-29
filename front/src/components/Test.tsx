import React from 'react';

type Props = {
  name: string
}

function Test(props: Props) {
  let s = props.name;
  return (
    <div className='Test'>
      <p>うはは {s}</p>
    </div>
  )
}

export default Test;