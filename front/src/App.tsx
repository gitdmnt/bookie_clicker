import React from 'react';
import Test from './components/Test';
import Search from './components/Search';
import Booklist from './components/Booklist';
import Analytics from './components/Analytics';



function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p className="Title">
          Bookie Clicker
        </p>
      </header>
      <Search />
      <Booklist />
      <Analytics />

      <Test name="uda1" />
      <Test name="uda2" />
      <Test name="uda3" />
    </div>
  );
}

export default App;
