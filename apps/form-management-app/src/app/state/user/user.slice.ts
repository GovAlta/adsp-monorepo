import { Dispatch, createAsyncThunk, createSelector, createSlice, isRejectedWithValue } from '@reduxjs/toolkit';
import axios from 'axios';
import Keycloak from 'keycloak-js';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from '../../models';
import { ConfigState } from '../config.slice';
import { AppState } from '../store';
import { isAxiosErrorPayload } from '../util';
import { FeedbackMessage } from '../types';

export const USER_FEATURE_KEY = 'user';

export interface UserState {
  tenant: Tenant;
  initialized: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
  sessionExpiresAt: string;
  alertSessionExpiresAt: string;
}

let client: Keycloak;
async function initializeKeycloakClient(dispatch: Dispatch, realm: string, config: ConfigState) {
  const clientId = config?.environment?.access?.client_id;
  if (client?.realm !== realm && clientId !== undefined) {
    client = new Keycloak({
      url: `${config?.environment?.access?.url}/auth`,
      clientId,
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
      client.onAuthRefreshSuccess = () => {
        updateSessionTimeout(dispatch);
      };
    } catch (err) {
      // Keycloak client throws undefined in certain cases.
    }
  }

  return client;
}

let sessionTimeout;
function updateSessionTimeout(dispatch: Dispatch) {
  if (client.refreshTokenParsed) {
    const expires = DateTime.fromSeconds(client.refreshTokenParsed.exp);
    dispatch(userActions.setSessionExpiry({ expiresAt: expires.toISO(), alert: false }));

    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }

    const tilExpiresAlert = expires.diff(DateTime.now()).minus(120000);
    sessionTimeout = setTimeout(
      () => dispatch(userActions.setSessionExpiry({ expiresAt: expires.toISO(), alert: true })),
      tilExpiresAlert.as('milliseconds')
    );
  }
}

export async function getAccessToken(): Promise<string> {
  let token = null;
  if (client) {
    try {
      await client.updateToken(60);
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
      dispatch(initializeUser(tenant));
      return tenant;
    }
  }
);

export const initializeUser = createAsyncThunk(
  'user/initialize-user',
  async (tenant: Tenant, { getState, dispatch }) => {
    const { config } = getState() as AppState;

    const client = await initializeKeycloakClient(dispatch, tenant.realm, config);
    if (client.tokenParsed) {
      updateSessionTimeout(dispatch);

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

const getIdpHint = (): string => {
  const location: string = window.location.href;
  const skipSSO = location.indexOf('kc_idp_hint') > -1;

  const urlParams = new URLSearchParams(window.location.search);
  const idpFromUrl = urlParams.has('kc_idp_hint') ? encodeURIComponent(urlParams.get('kc_idp_hint')) : null;
  let idp = 'core';
  if (skipSSO && !idpFromUrl) {
    idp = ' ';
  }

  return idp;
};

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ tenant, from }: { tenant: Tenant; from: string }, { getState, dispatch }) => {
    const { config } = getState() as AppState;
    const idpHint = getIdpHint();

    const client = await initializeKeycloakClient(dispatch, tenant.realm, config);
    await client.login({
      idpHint,
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
  user: undefined,
  sessionExpiresAt: null,
  alertSessionExpiresAt: null,
};

export const renewSession = createAsyncThunk('user/renew-session', async (_, { dispatch }) => {
  // Getting the access token triggers refresh token use and update.
  await getAccessToken();
  updateSessionTimeout(dispatch);
});

const userSlice = createSlice({
  name: USER_FEATURE_KEY,
  initialState: initialUserState,
  reducers: {
    clearUser: (state) => {
      state.user = undefined;
    },
    setSessionExpiry: (state, { payload }: { payload: { expiresAt: string; alert: boolean } }) => {
      state.sessionExpiresAt = payload.expiresAt;
      state.alertSessionExpiresAt = payload.alert ? payload.expiresAt : null;
    },
  },
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

export const sessionExpirySelector = createSelector(
  (state: AppState) => state.user.alertSessionExpiresAt,
  (expiresAt) => ({
    secondsTilExpiry: expiresAt && Math.round(DateTime.fromISO(expiresAt).diff(DateTime.now()).as('seconds')),
    showAlert: !!expiresAt,
  })
);
