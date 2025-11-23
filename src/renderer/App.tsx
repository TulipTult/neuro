import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { NavBar } from './components/NavBar';
import { ChatBar } from './components/ChatBar';
import { ScanButton } from './components/ScanButton';
import { useEffect, useState } from 'react';

function Hello() {
  const [availableAssets, setAvailableAssets] = useState<string[]>([]);
  const [componentImages, setComponentImages] = useState<
    {
      id: number;
      name: string;
      src: string;
      left: string;
      top: string;
      count: number | null;
    }[]
  >([]);

  useEffect(() => {
    window.electron?.ipcRenderer
      .invoke('list-assets')
      .then((list: string[]) => setAvailableAssets(list || []));
  }, []);

  const handleComponentsFound = (
    components: { name: string; count: number | null }[] | undefined,
  ) => {
    (window as any).scannedComponents = components || []; // <-- expose to ChatBar
    if (!components || components.length === 0) {
      setComponentImages([]);
      return;
    }
    const matches = components.filter((c) =>
      availableAssets.includes(c.name.toLowerCase()),
    );
    const overlays = matches.map((c) => ({
      id: Date.now() + Math.random(),
      name: c.name,
      src: `/assets/${c.name}.png`,
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 80 + 10}%`,
      count: c.count ?? null,
    }));
    setComponentImages(overlays);
  };

  return (
    <div className="layout-root">
      <NavBar />
      <main className="main-content">
        <div className="Hello">
          <img alt="logo" src="/assets/logo.png" width={30} />
          <h1>Neuro</h1>
        </div>
        <div className="pad-wrapper">
          <img alt="pad" src="/assets/PAD.png" width={800} />
          {componentImages.map((ci) => (
            <img
              key={ci.id}
              alt={ci.name}
              src={ci.src}
              className="component-overlay"
              style={{ left: ci.left, top: ci.top }}
            />
          ))}
        </div>
        {componentImages.length > 0 && (
          <div className="component-list">
            {componentImages.map((ci) => (
              <span key={`tag-${ci.id}`} className="component-tag">
                {ci.name} ({ci.count === null ? '?' : ci.count})
              </span>
            ))}
          </div>
        )}
        <ScanButton onComponentsFound={handleComponentsFound} />
      </main>
      <ChatBar />
    </div>
  );
}

export default function App() {
  // Circle elements
  const circles = [
    { className: 'heat-circle1', left: '52%', top: '48%' },
    { className: 'heat-circle2', left: '52%', top: '62%' },
    { className: 'heat-circle3', left: '40.5%', top: '48%' },
    { className: 'heat-circle4', left: '40.5%', top: '62%' },
  ];

  const renderCircles = () => {
    return circles.map((circle, index) => (
      <div key={index} className={circle.className} style={{ borderRadius: '50%', width: '100px', height: '100px', backgroundColor: 'red', position: 'absolute', left: circle.left, top: circle.top, transform: 'translate(-50%, -50%)' }} />
    ));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
