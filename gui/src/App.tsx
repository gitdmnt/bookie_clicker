import Register from './components/Register';
import Booklist from './components/Booklist';
import Analytics from './components/Analytics';

export default function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p className="Title">
          Bookie Clicker
        </p>
      </header>
      <Register />
      <Booklist />
      <Analytics />

      <div className='debug'>
        <p>9784000078702</p>
        <p>9784588010590</p>
      </div>
    </div>
  );
}
