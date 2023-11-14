import '@style/app.css';
import '@style/colors.scss';
import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom-6';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from '@store/index';
import { PrivateApp } from './privateApp';
import { fetchConfig } from '@store/config/actions';
import AuthContext from '@lib/authContext';

import { ThemeProvider } from 'styled-components';
import { theme } from 'theme';
import PublicApp from './publicApp';
import '@abgov/web-components/index.css';

const AppRouters = () => {
  return (
    <Router>
      <Routes>
        <Route path="/subscriptions/:realm/*" element={<PrivateApp />} />
        <Route path="/*" element={<PublicApp />} />
      </Routes>
    </Router>
  );
};

export const App = (): JSX.Element => {
  return (
    <div style={{ overflowX: 'hidden', minHeight: '100vh' }}>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <AppWithAuthContext />
        </Provider>
      </ThemeProvider>
    </div>
  );
};

function AppWithAuthContext() {
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);

  const dispatch = useDispatch();
  useEffect(() => {
    // Fetch config
    if (!keycloakConfig) {
      dispatch(fetchConfig());
    }
  }, [dispatch, keycloakConfig]);

  return (
    <div>
      <AuthContext.Provider value={{}}>{keycloakConfig && <AppRouters />}</AuthContext.Provider>
    </div>
  );
}

export default App;
