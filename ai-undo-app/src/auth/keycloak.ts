import Keycloak from 'keycloak-js';

const REALM_STORAGE_KEY = 'ai-undo-app.realm';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUUID = (value: string) => uuidRegex.test(value);

export const config = {
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL || 'https://access.adsp-dev.gov.ab.ca/auth',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'urn:ads:platform:tenant-admin-app',
  defaultRealm: import.meta.env.VITE_DEFAULT_REALM || 'autotest',
  tenantApiUrl: import.meta.env.VITE_TENANT_API_URL || 'https://tenant-service.adsp-dev.gov.ab.ca',
  agentServiceUrl: import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:3380',
  agentId: import.meta.env.VITE_AGENT_ID || 'mock-agent',
};

export function getStoredRealm(): string {
  return localStorage.getItem(REALM_STORAGE_KEY) || config.defaultRealm;
}

export function setStoredRealm(realm: string) {
  localStorage.setItem(REALM_STORAGE_KEY, realm);
}

/** Resolve a tenant name to a Keycloak realm id (UUID), or return UUID as-is. */
export async function resolveRealm(nameOrRealm: string): Promise<string> {
  const trimmed = nameOrRealm.trim();
  if (!trimmed) {
    throw new Error('Realm / tenant name is required.');
  }
  if (isUUID(trimmed)) {
    return trimmed;
  }

  const actualName = encodeURIComponent(trimmed.replace(/-/g, ' '));
  const url = new URL(`/api/tenant/v2/tenants?name=${actualName}`, config.tenantApiUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to resolve tenant "${trimmed}" (${response.status}).`);
  }
  const data = (await response.json()) as { results?: Array<{ realm: string }> };
  if (data.results?.length !== 1) {
    throw new Error(`Tenant "${trimmed}" not found.`);
  }
  return data.results[0].realm;
}

let keycloak: Keycloak | null = null;
let initializedRealm: string | null = null;
let initPromise: Promise<Keycloak> | null = null;

export function getKeycloak(): Keycloak {
  if (!keycloak) {
    throw new Error('Keycloak has not been initialized.');
  }
  return keycloak;
}

/**
 * Initialize Keycloak once per realm. Concurrent callers share the same promise so
 * React StrictMode remounts (and login redirects to /chat) still process the OAuth callback.
 */
export async function initKeycloak(realm: string): Promise<Keycloak> {
  if (initializedRealm === realm && keycloak) {
    return keycloak;
  }

  if (initPromise && initializedRealm === realm) {
    return initPromise;
  }

  initializedRealm = realm;
  initPromise = (async () => {
    const instance = new Keycloak({
      url: config.keycloakUrl,
      realm,
      clientId: config.clientId,
    });

    await instance.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    keycloak = instance;
    return instance;
  })();

  try {
    return await initPromise;
  } catch (err) {
    initializedRealm = null;
    initPromise = null;
    keycloak = null;
    throw err;
  }
}

export async function login(realmInput: string): Promise<void> {
  const realm = await resolveRealm(realmInput);
  // Persist resolved realm UUID so the /chat callback initializes the same realm.
  setStoredRealm(realm);
  const kc = await initKeycloak(realm);
  await kc.login({
    redirectUri: `${window.location.origin}/chat`,
  });
}

export async function logout(): Promise<void> {
  const kc = getKeycloak();
  await kc.logout({ redirectUri: `${window.location.origin}/` });
}

export async function getAccessToken(): Promise<string> {
  const kc = getKeycloak();
  if (!kc.authenticated) {
    throw new Error('Not authenticated.');
  }
  await kc.updateToken(60);
  if (!kc.token) {
    throw new Error('No access token available.');
  }
  return kc.token;
}
