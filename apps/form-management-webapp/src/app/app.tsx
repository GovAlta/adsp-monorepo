import '@style/app.css';
import '@style/colors.scss';
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import Login from '@pages/public/Login';
import LoginRedirect from '@pages/public/LoginRedirect';
import LogoutRedirect from '@pages/public/LogoutRedirect';
import Admin from '@pages/admin';
import { store, setConfig } from '@store/index';
import { PrivateApp } from './privateApp';
import PublicApp from './publicApp';

const FetchConfigOnce: React.FC = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/config/config.json?v=2');
        if (res.ok) {
          const data = await res.json();
          // If your config.json already has { keycloakApi: { url, realm, clientId } } then this is enough.
          dispatch(setConfig({ keycloakApi: data.keycloakApi } as any));
        }
      } catch {
        // ignore; runtime env may inject config differently
      }
    })();
  }, [dispatch]);
  return null;
};

const PrefixRedirect: React.FC = () => {
  const { prefix } = useParams();
  return <Navigate to={`/${prefix}/login${window.location.search}`} replace />;
};

const App = (): JSX.Element => {
  return (
    <div style={{ overflowX: 'hidden', minHeight: '100vh' }}>
      <Provider store={store}>
        <FetchConfigOnce />
        <Routes>
          <Route path="/" element={<PublicApp />}>
            <Route index element={<Login />} />
          </Route>

          <Route path="/login" element={<PublicApp />}>
            <Route index element={<Login />} />
          </Route>
          <Route path="/login-redirect" element={<PublicApp />}>
            <Route index element={<LoginRedirect />} />
          </Route>
          <Route path="/logout-redirect" element={<PublicApp />}>
            <Route index element={<LogoutRedirect />} />
          </Route>

          <Route path="/:prefix" element={<PublicApp />}>
            <Route index element={<PrefixRedirect />} />
          </Route>
          <Route path="/:prefix/login" element={<PublicApp />}>
            <Route index element={<Login />} />
          </Route>
          <Route path="/:prefix/login-redirect" element={<PublicApp />}>
            <Route index element={<LoginRedirect />} />
          </Route>
          <Route path="/:prefix/logout-redirect" element={<PublicApp />}>
            <Route index element={<LogoutRedirect />} />
          </Route>

          <Route element={<PrivateApp />}>
            <Route path="/admin/*" element={<Admin />} />
          </Route>

          <Route path="*" element={<PublicApp />}>
            <Route index element={<Login />} />
          </Route>
        </Routes>
      </Provider>
    </div>
  );
};

export default App;
