import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Examples from './pages/Examples';
import Apply from './pages/Apply';
import './styles.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    try {
      window.parent.postMessage({ type: 'preview-error', message: error.message, stack: error.stack || '' }, '*');
    } catch (_) {}
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '16px', color: '#5c1b14', background: '#fff3f0', borderRadius: '8px', margin: '16px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}>
          <strong>Component error</strong>
          <br />
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

function NavigationBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: Event) => navigate((e as CustomEvent<string>).detail);
    window.addEventListener('preview:navigate', handler);
    return () => window.removeEventListener('preview:navigate', handler);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <Router>
      <NavigationBridge />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/about" element={<About />} />
          <Route path="/components" element={<Examples />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
