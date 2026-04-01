import { Dispatch, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import Keycloak from 'keycloak-js';
import { ConfigState } from './config.slice';
import { AppState } from './store';

export const USER_FEATURE_KEY = 'user';

export interface Tenant {
  id: string;
  name: string;
  realm: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface UserState {
  tenant: Tenant | null;
  initialized: boolean;
  user: UserProfile | null;
}

let client: Keycloak | undefined;

function resolveRedirectUri(from: string): string {
  const target = (from || '/').trim();
  return new URL(target, window.location.origin).href;
}

async function initializeKeycloakClient(dispatch: Dispatch, realm: string, config: ConfigState) {
  if (client?.realm !== realm) {
    client = new Keycloak({
      url: `${config.environment.access?.url}/auth`,
      clientId: config.environment.access?.client_id,
      realm,
    });

    client.onAuthLogout = () => {
      dispatch(userActions.clearUser());
    };
  }

  // Always call init to process any auth code in the URL and check SSO status
  if (client && !client.authenticated) {
    try {
      await client.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: true,
        silentCheckSsoRedirectUri: new URL('/silent-check-sso.html', window.location.href).href,
      });
    } catch {
      // Keycloak can throw undefined in some browser states.
    }
  }

  return client;
}

export async function getAccessToken(dispatch: Dispatch, realm: string, config: ConfigState): Promise<string | null> {
  const keycloak = await initializeKeycloakClient(dispatch, realm, config);

  if (!keycloak?.authenticated) {
    return null;
  }

  try {
    await keycloak.updateToken(30);
  } catch {
    dispatch(userActions.clearUser());
    return null;
  }

  return keycloak.token ?? null;
}

const getIdpHint = (): string => {
  const skipSSO = window.location.href.includes('kc_idp_hint');
  const urlParams = new URLSearchParams(window.location.search);
  const idpFromUrl = urlParams.has('kc_idp_hint') ? encodeURIComponent(urlParams.get('kc_idp_hint') ?? '') : null;

  let idp = 'core';
  if (skipSSO && !idpFromUrl) {
    idp = ' ';
  }

  return idp;
};

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

    const tenant = data?.results?.[0] ?? null;
    if (tenant) {
      dispatch(initializeUser(tenant));
    }

    return tenant;
  },
);

export const initializeUser = createAsyncThunk(
  'user/initialize-user',
  async (tenant: Tenant, { getState, dispatch }): Promise<UserProfile | null> => {
    const { config } = getState() as AppState;
    const keycloak = await initializeKeycloakClient(dispatch, tenant.realm, config);

    if (!keycloak?.tokenParsed) {
      return null;
    }

    const tokenParsed = keycloak.tokenParsed as Record<string, unknown>;
    const realmRoles = ((tokenParsed.realm_access as { roles?: string[] } | undefined)?.roles ?? []).filter(Boolean);
    const resourceAccess = (tokenParsed.resource_access as Record<string, { roles?: string[] }> | undefined) ?? {};

    return {
      id: String(tokenParsed.sub ?? ''),
      name: String(tokenParsed.name ?? tokenParsed.preferred_username ?? tokenParsed.email ?? ''),
      email: String(tokenParsed.email ?? ''),
      roles: Object.entries(resourceAccess).reduce<string[]>(
        (roles, [resourceClient, resource]) => [
          ...roles,
          ...(resource.roles?.map((clientRole) => `${resourceClient}:${clientRole}`) ?? []),
        ],
        realmRoles,
      ),
    };
  },
);

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ tenant, from }: { tenant: Tenant; from: string }, { getState, dispatch }) => {
    const { config } = getState() as AppState;
    const keycloak = await initializeKeycloakClient(dispatch, tenant.realm, config);

    if (!keycloak) {
      return null;
    }

    await keycloak.login({
      idpHint: getIdpHint(),
      redirectUri: resolveRedirectUri(from),
    });

    return null;
  },
);

export const loginUserWithIDP = createAsyncThunk(
  'user/login-idp',
  async ({ realm, idpFromUrl, from }: { realm: string; idpFromUrl: string; from: string }, { getState, dispatch }) => {
    const { config } = getState() as AppState;
    const keycloak = await initializeKeycloakClient(dispatch, realm, config);

    if (!keycloak) {
      return null;
    }

    await keycloak.login({
      idpHint: idpFromUrl,
      redirectUri: resolveRedirectUri(from),
    });

    return null;
  },
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async ({ tenant, from }: { tenant: Tenant; from: string }, { getState, dispatch }) => {
    const { config } = getState() as AppState;
    const keycloak = await initializeKeycloakClient(dispatch, tenant.realm, config);

    if (!keycloak) {
      return;
    }

    await keycloak.logout({
      redirectUri: resolveRedirectUri(from),
    });
  },
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
        state.user = payload;
        state.initialized = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const userReducer = userSlice.reducer;
export const userActions = userSlice.actions;

export const tenantSelector = (state: AppState) => state.user.tenant;
export const userSelector = (state: AppState) => state.user.user;
