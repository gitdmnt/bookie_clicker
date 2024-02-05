import Register from "./components/Register";
import Analytics from "./components/Analytics";
import BookList from "./components/BookList";
import { Config } from "./components/Config";

export default function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="Title">Bookie Clicker</h1>
      </header>
      <Config />
      <Register />
      <BookList />
      <Analytics />
    </div>
  );
}

