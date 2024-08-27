import React, { useEffect } from 'react';
import { Recaptcha } from '@core-services/app-common';
import '@style/app.css';
import '@style/colors.scss';
import '@style/goa-core.scss';
import { fetchConfig, recaptchaScriptLoaded } from './store/config/actions';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ServiceStatusPage from './pages/status';
import { RootState } from '@store/index';
import '@abgov/web-components/index.css';

export function App(): JSX.Element {
  const dispatch = useDispatch();

  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));

  useEffect(() => {
    dispatch(fetchConfig());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <Recaptcha siteKey={config.recaptchaKey} onLoad={() => dispatch(recaptchaScriptLoaded())} />
    </div>
  );
}

export default App;
