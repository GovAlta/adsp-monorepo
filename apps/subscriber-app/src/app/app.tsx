import '@style/app.css';
import '@style/colors.scss';
import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from '@store/index';
import { PrivateApp } from './privateApp';
import { fetchConfig } from '@store/config/actions';
import AuthContext from '@lib/authContext';

import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import { theme } from 'theme';
import PublicApp from './publicApp';
import '@abgov/web-components/index.css';

const AppRouters = () => {
  return (
    <Routes>
      <Route path="/subscriptions/:realm/*" element={<PrivateApp />} />
      <Route path="/*" element={<PublicApp />} />
    </Routes>
  );
};

const AppDiv = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
`;

export const App = (): JSX.Element => {
  return (
    <AppDiv>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <AppWithAuthContext />
        </Provider>
      </ThemeProvider>
    </AppDiv>
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
