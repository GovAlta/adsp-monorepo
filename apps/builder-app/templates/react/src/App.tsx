import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Examples from './pages/Examples';
import Apply from './pages/Apply';
import './styles.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/about" element={<About />} />
        <Route path="/components" element={<Examples />} />
      </Routes>
    </Router>
  );
}
