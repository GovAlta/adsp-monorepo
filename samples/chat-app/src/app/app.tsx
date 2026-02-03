import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserManager } from 'oidc-client';
import { UserState } from 'redux-oidc';
import {
  GoabButton,
  GoabAppHeader,
  GoabMicrositeHeader,
} from '@abgov/react-components';

import styles from './app.module.scss';
import { Route, Routes } from 'react-router-dom';
import { Landing } from './landing';
import { Chat } from './chat';

interface AppProps {
  userManager: UserManager;
}

export function App({ userManager }: AppProps) {
  const user = useSelector((state: { user: UserState }) => state.user.user);

  return (
    <div className={styles.app}>
      <GoabMicrositeHeader type="beta" />
      <GoabAppHeader heading="ADSP Chat Example" url="/">
        {user ? (
          <GoabButton onClick={() => userManager.signoutRedirect()}>
            Sign Out
          </GoabButton>
        ) : (
          <GoabButton onClick={() => userManager.signinRedirect()}>
            Sign In
          </GoabButton>
        )}
      </GoabAppHeader>
      <Routes>
        <Route path="/chat" element={<Chat />} />
        <Route path="/" element={<Landing />} />
      </Routes>
    </div>
  );
}

export default App;
