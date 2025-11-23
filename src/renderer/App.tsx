import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { NavBar } from './components/NavBar';
import { ChatBar } from './components/ChatBar';

function Hello() {
  return (
    <div className="layout-root">
      <NavBar />
      <main className="main-content">
        <div className="Hello">
          <img alt="logo" src="/assets/logo.png" width={30} />
          <h1>Neuro</h1>
        </div>
        <img alt="pad" src="/assets/PAD.png" width={500} />
      </main>
      <ChatBar />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
