/* eslint-disable */
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Session } from './session/models';
import type { ConfigState, KeycloakApi } from './config/models';
import { SESSION_INIT } from './session/models';

const sessionSlice = createSlice({
  name: 'session',
  initialState: SESSION_INIT as Session,
  reducers: {
    setSession(state, action: PayloadAction<Session>) {
      Object.assign(state, action.payload || {});
    },
    clearSession(state) {
      Object.assign(state, SESSION_INIT);
    },
  },
});

const initialConfig = {} as ConfigState;

const configSlice = createSlice({
  name: 'config',
  initialState: initialConfig,
  reducers: {
    setConfig(state, action: PayloadAction<ConfigState>) {
      const cfg = action.payload || ({} as ConfigState);
      if (cfg.keycloakApi) state.keycloakApi = cfg.keycloakApi as any;
      if (cfg.tenantApi) state.tenantApi = cfg.tenantApi as any;
      if (cfg.serviceUrls) state.serviceUrls = cfg.serviceUrls as any;
      if (cfg.fileApi) state.fileApi = cfg.fileApi as any;
      if (cfg.featureFlags) state.featureFlags = cfg.featureFlags as any;
      if (cfg.feedback) state.feedback = cfg.feedback as any;
    },
    setRealm(state, action: PayloadAction<string>) {
      const realm = action.payload;
      if (!state.keycloakApi) state.keycloakApi = { realm, url: '', clientId: '' } as KeycloakApi;
      state.keycloakApi.realm = realm;
    },
    logoutConfig(state) {
      if (state.keycloakApi) state.keycloakApi.realm = 'core';
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export const { setConfig, setRealm, logoutConfig } = configSlice.actions;

export const store = configureStore({
  reducer: {
    session: sessionSlice.reducer,
    config: configSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

if (typeof window !== 'undefined') {
  (window as any).__APP_STORE__ = { getState: store.getState, dispatch: store.dispatch };
}
