import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import keycloak, { KeycloakInstance } from 'keycloak-js';
import { ConfigState } from './config.slice';
import { AppState } from './store';

export const USER_FEATURE_KEY = 'user';

interface Tenant {
  id: string;
  name: string;
  realm: string;
}

export interface UserState {
  tenant: Tenant;
  initialized: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    accessToken: string;
  };
  roles: [];
}

let client: KeycloakInstance;
async function initializeKeycloakClient(realm: string, config: ConfigState) {
  if (client?.realm !== realm) {
    client = keycloak({
      url: `${config.environment.access.url}/auth`,
      clientId: config.environment.access.client_id,
      realm,
    });

    await client.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: new URL('/silent-check-sso.html', window.location.href).href,
    });
  }

  return client;
}

export const initializeTenant = createAsyncThunk(
  'user/initialize-tenant',
  async (name: string, { getState, dispatch }) => {
    const { config } = getState() as AppState;
    const url = config.directory['urn:ads:platform:tenant-service'];
    if (!url) {
      return null;
    }

    const { data } = await axios.get<{ results: Tenant[] }>(new URL('/api/tenant/v2/tenants', url).href, {
      params: {
        name: name.replace(/-/g, ' '),
      },
    });

    const tenant = data?.results?.[0];
    if (tenant) {
      dispatch(initializeUser(tenant));
    }

    return tenant;
  }
);

export const initializeUser = createAsyncThunk('user/initialize-user', async (tenant: Tenant, { getState }) => {
  const { config } = getState() as AppState;

  const client = await initializeKeycloakClient(tenant.realm, config);
  if (client.tokenParsed) {
    return {
      id: client.tokenParsed.sub,
      name: client.tokenParsed['preferred_username'] || client.tokenParsed['email'],
      email: client.tokenParsed['email'],
      accessToken: client.token,
    };
  } else {
    return null;
  }
});

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ tenant, from }: { tenant: Tenant; from: string }, { getState }) => {
    const { config } = getState() as AppState;

    const client = await initializeKeycloakClient(tenant.realm, config);
    await client.login({
      idpHint: 'core',
      redirectUri: new URL(`/auth/callback?from=${from}`, window.location.href).href,
    });

    return await client.loadUserProfile();
  }
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async ({ tenant, from }: { tenant: Tenant; from: string }, { getState }) => {
    const { config } = getState() as AppState;

    const client = await initializeKeycloakClient(tenant.realm, config);
    await client.logout({
      redirectUri: new URL(`/auth/callback?from=${from}`, window.location.href).href,
    });
  }
);

const initialUserState: UserState = {
  initialized: false,
  tenant: null,
  user: null,
  roles: [],
};

const userSlice = createSlice({
  name: USER_FEATURE_KEY,
  initialState: initialUserState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeTenant.fulfilled, (state, { payload }) => {
        state.tenant = payload;
      })
      .addCase(initializeUser.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.initialized = true;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.user = payload as typeof state.user;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const userReducer = userSlice.reducer;

export const tenantSelector = createSelector(
  (state: AppState) => state.user,
  (user) => user.tenant
);

export const userInitializedSelector = createSelector(
  (state: AppState) => state.user,
  (user) => user.initialized
);

export const userSelector = createSelector(
  (state: AppState) => state.user,
  (user) => user.user
);
