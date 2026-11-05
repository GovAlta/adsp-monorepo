import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { KeycloakTokenParsed } from 'keycloak-js';
import type { ConfigState } from '../config/slice';
import { createKeycloakClient, getKeycloakClient } from './keycloak';

export interface SessionState {
  initialized: boolean;
  authenticated: boolean;
  userInfo?: { name: string; email: string };
  resourceAccess?: Record<string, { roles: string[] }>;
}

type SessionDetails = Omit<SessionState, 'initialized'>;

const toSession = (authenticated: boolean, token?: KeycloakTokenParsed): SessionDetails =>
  authenticated && token
    ? {
        authenticated: true,
        userInfo: { name: token['name'] || token['preferred_username'] || token['email'], email: token['email'] },
        resourceAccess: token.resource_access,
      }
    : { authenticated: false };

export const initializeSession = createAsyncThunk<SessionDetails, void, { state: { config: ConfigState } }>(
  'session/initialize',
  async (_, { getState }) => {
    const client = createKeycloakClient(getState().config.environment.access);
    try {
      await client.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: new URL('/silent-check-sso.html', window.location.href).href,
      });
    } catch {
      // keycloak-js rejects with undefined when there is no session to check.
    }
    return toSession(client.authenticated, client.tokenParsed);
  },
);

export const loginUser = createAsyncThunk('session/login', async () => {
  await getKeycloakClient()?.login({ idpHint: 'core', redirectUri: window.location.href });
});

export const logoutUser = createAsyncThunk('session/logout', async () => {
  await getKeycloakClient()?.logout({ redirectUri: `${window.location.origin}/` });
});

const initialState: SessionState = { initialized: false, authenticated: false };

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    sessionExpired: (state) => {
      state.authenticated = false;
      state.userInfo = undefined;
      state.resourceAccess = undefined;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeSession.fulfilled, (_state, { payload }) => ({ ...payload, initialized: true }));
  },
});

export const sessionReducer = sessionSlice.reducer;
export const { sessionExpired } = sessionSlice.actions;
