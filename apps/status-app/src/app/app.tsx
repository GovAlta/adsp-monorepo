import React, { useEffect } from 'react';
import '@style/app.css';
import '@style/colors.scss';
import '@style/goa-core.scss';
import { fetchConfig } from './store/config/actions';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom-6';
import ServiceStatusPage from './pages/status';
import Recaptcha from './components/Recaptcha';
import { RootState } from '@store/index';
import '@abgov/web-components/index.css';

export function App(): JSX.Element {
  const dispatch = useDispatch();

  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));
  useEffect(() => {
    // Fetch config
    dispatch(fetchConfig());
  }, []);

  return (
    <div>
      {config.envLoaded && (
        <Router>
          <Routes>
            <Route path="/" element={<ServiceStatusPage />}></Route>
            <Route path="/:name" element={<ServiceStatusPage />}></Route>
          </Routes>
        </Router>
      )}
      <Recaptcha siteKey={config.recaptchaKey} />
    </div>
  );
}

export default App;
