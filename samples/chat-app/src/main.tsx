import { GoabCircularProgress } from '@abgov/react-components';
import '@abgov/web-components';
import { configureStore } from '@reduxjs/toolkit';
import { User, UserManager } from 'oidc-client';
import decodeJwt from 'jwt-decode';
import React, { FunctionComponent } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import {
  Action,
  CallbackComponent,
  loadUser,
  OidcProvider,
  reducer as oidcReducer,
  SignoutCallbackComponent,
  UserState,
  USER_FOUND,
} from 'redux-oidc';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';

import { createUserManager } from './access';
import {
  ConfigState,
  CONFIG_FEATURE_KEY,
  getConfiguration,
  configReducer,
} from './app/config.slice';
import { chatReducer, CHAT_FEATURE_KEY } from './app/chat.slice';
import App from './app/app';

const store = configureStore({
  reducer: {
    user: (state: UserState | undefined, action) => {
      if (action.type === USER_FOUND) {
        const userAction = action as Action<User>;
        if (userAction.payload?.access_token) {
          const result: Record<string, unknown> = decodeJwt(
            userAction.payload.access_token
          );
          const resourceAccess = result.resource_access as Record<string, { roles?: string[] }> | undefined;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (action as any).payload.roles = resourceAccess?.['urn:ads:demo:chat-service']?.roles || [];
        }
      }
      return oidcReducer(state, action);
    },
    [CONFIG_FEATURE_KEY]: configReducer,
    [CHAT_FEATURE_KEY]: chatReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'redux-oidc/USER_FOUND',
          'chat/fetchMessages/fulfilled',
          'chat/receivedMessage',
          'chat/sendMessage/fulfilled',
        ],
        ignoredPaths: ['user.user', 'chat.messages'],
      },
    });
  },
  devTools: true,
  // Optional Redux store enhancers
  enhancers: [],
});

store.dispatch(getConfiguration());
export type AppDispatch = typeof store.dispatch;

const AuthCallback: FunctionComponent<{ userManager: UserManager }> = ({ userManager }) => {
  const navigate = useNavigate();
  return (
    <CallbackComponent
      userManager={userManager}
      successCallback={() => navigate('/chat')}
      errorCallback={() => navigate('/')}
    >
      <span>signing in...</span>
    </CallbackComponent>
  );
};

const SignoutCallback: FunctionComponent<{ userManager: UserManager }> = ({ userManager }) => {
  const navigate = useNavigate();
  return (
    <SignoutCallbackComponent
      userManager={userManager}
      successCallback={() => navigate('/')}
      errorCallback={() => navigate('/')}
    >
      <span>signing out...</span>
    </SignoutCallbackComponent>
  );
};

const Main: FunctionComponent = () => {
  const { accessServiceUrl, clientId, realm } = useSelector(
    (state: { config: ConfigState }) => state.config
  );

  let userManager: UserManager | null = null;
  if (accessServiceUrl && realm && clientId) {
    userManager = createUserManager({
      url: accessServiceUrl,
      realm,
      client_id: clientId,
    });
    loadUser(store, userManager);
  }
  return userManager ? (
    <OidcProvider store={store} userManager={userManager}>
      <React.StrictMode>
        <Router>
          <Routes>
            <Route
              path="/auth/callback"
              element={<AuthCallback userManager={userManager} />}
            />
            <Route
              path="/signout/callback"
              element={<SignoutCallback userManager={userManager} />}
            />
            <Route path="/*" element={<App userManager={userManager} />} />
          </Routes>
        </Router>
      </React.StrictMode>
    </OidcProvider>
  ) : (
    <GoabCircularProgress variant="fullscreen" size="large" />
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Provider store={store}>
    <Main />
  </Provider>
);
