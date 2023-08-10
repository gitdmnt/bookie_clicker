import React from 'react';


type Props = {
  sub: string
}

function App(props: Props) {
  let subject = props.sub;
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Hello {subject}!
        </p>
      </header>
    </div>
  );
}

export default App;
