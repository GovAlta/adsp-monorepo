import '@abgov/web-components/index.css';
import '@abgov/design-tokens/dist/tokens.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { BuilderTenant } from './containers/BuilderTenant';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import styles from './app.module.scss';

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          <Route path="/:tenant/*" element={<BuilderTenant />} />
          <Route path="/:realm/login" element={<Login />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
