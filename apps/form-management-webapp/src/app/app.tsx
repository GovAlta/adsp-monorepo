import '@style/app.css';
import '@style/colors.scss';

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SignInError } from '@pages/public/SignInError';
import Login from '@pages/public/Login';
import LoginRedirect from '@pages/public/LoginRedirect';
import LogoutRedirect from '@pages/public/LogoutRedirect';
import Admin from '@pages/admin';
import { store, RootState } from '@store/index';
import { PrivateApp } from './privateApp';
import { fetchConfig } from '@store/config/actions';
import AuthContext from '@lib/authContext';
import { ThemeProvider } from 'styled-components';
import { theme } from 'theme';
import PublicApp from './publicApp';
import styled from 'styled-components';
import { GoAHeader } from '@abgov/react-components-old';
import '@abgov/web-components/index.css';
import { useScripts } from '@core-services/app-common';

const AppRouters = () => {
  return (
    <>
      <MobileMessage>
        <GoAHeader serviceHome="/" serviceLevel="beta" serviceName={'DCM Group'}></GoAHeader>
        <h1>Portrait mode is currently not supported</h1>
        <h3>Please rotate your device</h3>
        <h3>For the best experience, please use a Desktop</h3>
      </MobileMessage>
      <HideMobile>
        <Routes>
          <Route path="/admin//*" element={<PrivateApp />}>
            <Route path="*" element={<Admin />} />
          </Route>

          <Route path="/*" element={<PublicApp />}>
            <Route path=":realm/login" element={<Login />} />
            <Route path="login-redirect" element={<LoginRedirect />} />
            <Route path="login-error" element={<SignInError />} />
            <Route path="logout-redirect" element={<LogoutRedirect />} />
          </Route>
        </Routes>
      </HideMobile>
    </>
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
  const { keycloakApi: keycloakConfig, feedback } = useSelector((state: RootState) => state.config);
  const dispatch = useDispatch();
  useEffect(() => {
    // Fetch config
    if (!keycloakConfig) {
      dispatch(fetchConfig());
    }
  }, [dispatch, keycloakConfig]);

  useScripts(feedback?.script);

  return <AuthContext.Provider value={{}}>{keycloakConfig?.realm && <AppRouters />}</AuthContext.Provider>;
}

export default App;

const HideMobile = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileMessage = styled.div`
  h1,
  h3 {
    text-align: center;
    margin: 40px;
  }

  @media (min-width: 768px) {
    display: none;
  }
`;
