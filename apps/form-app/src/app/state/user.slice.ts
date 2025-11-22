import { Dispatch, createAsyncThunk, createSlice, isRejectedWithValue } from '@reduxjs/toolkit';
import axios from 'axios';
import Keycloak from 'keycloak-js';
import { v4 as uuidv4 } from 'uuid';
import { ConfigState } from './config.slice';
import { FeedbackMessage } from './feedback.slice';
import { AppState } from './store';
import { isAxiosErrorPayload } from './util';

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
    roles: string[];
  };
}

let client: Keycloak;

export const getKeycloakExpiry = () => {
  if (client) {
    return client?.refreshTokenParsed?.exp || 0;
  }

  return 0;
};

async function initializeKeycloakClient(dispatch: Dispatch, realm: string, config: ConfigState) {
  if (client?.realm !== realm) {
    client = new Keycloak({
      url: `${config.environment.access.url}/auth`,
      clientId: config.environment.access.client_id,
      realm,
    });

    try {
      await client.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: new URL('/silent-check-sso.html', window.location.href).href,
      });
      client.onAuthLogout = () => {
        dispatch(userActions.clearUser());
      };
    } catch (err) {
      // Keycloak client throws undefined in certain cases.
    }
  }

  return client;
}

export async function getAccessToken(): Promise<string> {
  let token = null;
  if (client) {
    try {
      await client.updateToken(5 * 60);
      token = client.token;
    } catch (err) {
      // If we're unable to update token, return no value and the request will fail on 401.
    }
  }
  return token;
}

export const initializeTenant = createAsyncThunk(
  'user/initialize-tenant',
  async (name: string, { getState, dispatch, rejectWithValue }) => {
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
    if (!tenant) {
      return rejectWithValue({
        id: uuidv4(),
        level: 'error',
        message: `Tenant "${name}" not found.`,
      } as FeedbackMessage);
    } else {
      console.log('we are initializing - form');
      dispatch(initializeUser(tenant));
      return tenant;
    }
  }
);

export const initializeUser = createAsyncThunk(
  'user/initialize-user',
  async (tenant: Tenant, { getState, dispatch }) => {
    const { config } = getState() as AppState;

        console.log(JSON.stringify(config) + "<-client")

    const client = await initializeKeycloakClient(dispatch, tenant.realm, config);


    console.log(JSON.stringify(client) + "<-client22")
    if (client.tokenParsed) {
      return {
        id: client.tokenParsed.sub,
        name: client.tokenParsed['name'] || client.tokenParsed['preferred_username'] || client.tokenParsed['email'],
        email: client.tokenParsed['email'],
        roles: Object.entries(client.tokenParsed.resource_access || {}).reduce(
          (roles, [client, clientAccess]) => [
            ...roles,
            ...(clientAccess.roles?.map((clientRole) => `${client}:${clientRole}`) || []),
          ],
          client.tokenParsed.realm_access?.roles || []
        ),
      };
    } else {
      return null;
    }
  }
);

export const loginUserWithIDP = createAsyncThunk(
  'user/login-idp',
  async ({ realm, idpFromUrl, from }: { realm: string; idpFromUrl: string; from: string }, { getState, dispatch }) => {

    const { config } = getState() as AppState;

           console.log(JSON.stringify(config) + "<-configconfigconfig")

    const client = await initializeKeycloakClient(dispatch, realm, config);
               console.log(JSON.stringify(client) + "<-clientclient")
    Promise.all([
      client.login({
        idpHint: idpFromUrl,
        redirectUri: from === '/' ? new URL(`/auth/callback?from=${'/'}`, window.location.href).href : from,
      }),
    ]);



    // Client login causes redirect, so this code and the thunk fulfilled reducer are de facto not executed.
    return await client.loadUserProfile();
  }
);

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ tenant, from }: { tenant: Tenant; from: string }, { getState, dispatch }) => {

    const { config } = getState() as AppState;

           console.log(JSON.stringify(config) + "<-config")

    const client = await initializeKeycloakClient(dispatch, tenant.realm, config);
  console.log(JSON.stringify(client) + "<-client")

    await client.login({
      redirectUri: new URL(`/auth/callback?from=${from}`, window.location.href).href,
    });

    // Client login causes redirect, so this code and the thunk fulfilled reducer are de facto not executed.
    return await client.loadUserProfile();
  }
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async ({ tenant, from }: { tenant: Tenant; from: string }, { getState, dispatch }) => {
    const { config } = getState() as AppState;

    const client = await initializeKeycloakClient(dispatch, tenant.realm, config);
    await client.logout({
      redirectUri: new URL(`/auth/callback?from=${from}`, window.location.href).href,
    });
  }
);

const initialUserState: UserState = {
  initialized: false,
  tenant: null,
  user: null,
};

const userSlice = createSlice({
  name: USER_FEATURE_KEY,
  initialState: initialUserState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeTenant.fulfilled, (state, { payload }) => {
        state.tenant = payload;
      })
      .addCase(initializeUser.fulfilled, (state, { payload }) => {
        console.log("do we never get here or do we");
         console.log(JSON.stringify(payload) + "<-payload")
        state.user = payload;
        state.initialized = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(loginUserWithIDP.fulfilled, (state, { payload }) => {
           console.log(JSON.stringify(payload) + "<-payload qqq")
        state.user = payload as typeof state.user;
      })
      .addMatcher(isRejectedWithValue(), (state, { payload }) => {
        if (isAxiosErrorPayload(payload) && payload.status === 401) {
          state.user = null;
        }
      });
  },
});

export const userReducer = userSlice.reducer;
export const userActions = userSlice.actions;

export const tenantSelector = (state: AppState) => state.user.tenant;

export const userSelector = (state: AppState) => state.user;
