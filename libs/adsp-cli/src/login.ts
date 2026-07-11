import * as fs from 'fs';
import * as express from 'express';
import * as open from 'open';
import { AccessToken, AuthorizationCode } from 'simple-oauth2';
import { getConfigFilePath, readConfig, writeConfig } from './config';
import { EnvironmentName, resolveEnvironmentName, resolveEnvironmentUrls, resolveTenantRealm } from './environments';
import { generatePkcePair } from './pkce';
import { findTenantByName, findTenantByRealm, listTenants, Tenant } from './tenants';
import { CacheEntry, getCacheFilePath, getCachedToken, hasScopes, isExpired, setCachedToken } from './tokenCache';

export type AccessTokenResult = { status: 'ok'; token: string } | { status: 'not-authenticated' };

const CALLBACK_PORT = 3000;
const LOGIN_TIMEOUT_MS = 120_000;
export const CORE_REALM = 'core';

function createClient(accessServiceUrl: string, realm: string): AuthorizationCode {
  return new AuthorizationCode({
    client: { id: 'adsp-cli', secret: '' },
    auth: {
      tokenHost: accessServiceUrl,
      tokenPath: `/auth/realms/${realm}/protocol/openid-connect/token`,
      authorizePath: `/auth/realms/${realm}/protocol/openid-connect/auth`,
    },
  });
}

async function refreshCachedToken(
  client: AuthorizationCode,
  accessServiceUrl: string,
  realm: string,
  cached: CacheEntry
): Promise<string | null> {
  if (!cached.refreshToken) {
    return null;
  }

  try {
    const { token } = await client
      .createToken({ access_token: cached.accessToken, refresh_token: cached.refreshToken })
      .refresh();
    const expiresIn = (token['expires_in'] as number) ?? 300;
    setCachedToken(
      accessServiceUrl,
      realm,
      token['access_token'] as string,
      token['refresh_token'] as string | undefined,
      expiresIn,
      cached.scopes
    );
    return token['access_token'] as string;
  } catch {
    // Refresh failed (revoked session, expired refresh token, etc.) — caller falls back accordingly.
    return null;
  }
}

/**
 * Cache-lookup-then-refresh for a specific realm — no browser, no env var reads. Shared by
 * getAccessToken() (the library fast path), getOrLogin() (used by the interactive CLI flow
 * to skip a redundant browser hop when a realm, e.g. "core", already has a valid cached token
 * that covers the requested scopes), and the CLI's `tenants` command (which lists tenants using
 * an already-cached core token but never triggers an interactive login itself).
 *
 * requiredScopes defaults to just ['email'] — the base scope every login always requests. A
 * cached entry only counts as usable if it covers requiredScopes (a subset check, see
 * tokenCache.ts's hasScopes — a token cached with MORE scopes than required still counts); if it
 * doesn't, this returns null (a miss) regardless of the token's validity, so callers needing an
 * elevated scope never silently get back a narrower cached token.
 */
export async function getCachedOrRefreshedToken(
  accessServiceUrl: string,
  realm: string,
  requiredScopes: string[] = ['email']
): Promise<string | null> {
  const cached = getCachedToken(accessServiceUrl, realm);
  if (!cached || !hasScopes(cached, requiredScopes)) {
    return null;
  }

  if (!isExpired(cached)) {
    return cached.accessToken;
  }

  const client = createClient(accessServiceUrl, realm);
  return refreshCachedToken(client, accessServiceUrl, realm, cached);
}

/**
 * Fast, non-interactive check for a usable access token: a valid cached token, or a
 * successful refresh. Never opens a browser — safe to call from any consumer, including
 * an MCP tool handler that must not block on user interaction.
 *
 * options.scopes requests additional scopes beyond the always-required 'email' — if the cached
 * token doesn't cover them, this returns 'not-authenticated' rather than attempting any browser
 * flow; the caller should tell the user to run `adsp-cli login --scope <name>` interactively.
 */
export async function getAccessToken(options: { scopes?: string[] } = {}): Promise<AccessTokenResult> {
  const envToken = process.env.ADSP_ACCESS_TOKEN;
  if (envToken) {
    return { status: 'ok', token: envToken };
  }

  const realmResolution = resolveTenantRealm();
  if (realmResolution.ok === false) {
    return { status: 'not-authenticated' };
  }

  const { accessServiceUrl } = resolveEnvironmentUrls();
  const requiredScopes = ['email', ...(options.scopes ?? [])];
  const token = await getCachedOrRefreshedToken(accessServiceUrl, realmResolution.tenantRealm, requiredScopes);
  return token ? { status: 'ok', token } : { status: 'not-authenticated' };
}

/**
 * The actual OAuth2 authorization-code browser flow for one realm: opens the browser, waits for
 * the redirect on a temporary local server, exchanges the code for a token, and caches it. Does
 * NOT check the cache first — callers that want a cache-check-first behavior should go through
 * getOrLogin() instead.
 */
async function browserLogin(accessServiceUrl: string, realm: string, scopes: string[]): Promise<string> {
  const client = createClient(accessServiceUrl, realm);
  const redirect_uri = `http://localhost:${CALLBACK_PORT}/callback`;
  const { codeVerifier, codeChallenge } = generatePkcePair();
  // @types/simple-oauth2's params interfaces don't declare PKCE fields, but the library itself passes
  // any extra key straight through (confirmed by reading its source) — going through a variable rather
  // than an object literal avoids TypeScript's excess-property check on an otherwise-accurate type.
  const authorizeParams = {
    redirect_uri,
    scope: scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };
  const authorizationUri = client.authorizeURL(authorizeParams);

  const app = express();
  const tokenPromise = new Promise<AccessToken>((resolve, reject) => {
    app.get('/callback', (req, res) => {
      const { code, error } = req.query;
      if (error) {
        res.send('Login failed.');
        reject(new Error(`Error encountered during login. ${error}`));
      } else {
        res.send('Successfully signed in. You can close this browser tab or window.');
        const tokenParams = { code: code as string, redirect_uri, code_verifier: codeVerifier };
        resolve(client.getToken(tokenParams));
      }
    });
  });

  const server = app.listen(CALLBACK_PORT);

  try {
    await open(authorizationUri);
  } catch (err) {
    server.close();
    throw new Error(
      `Could not open a browser automatically. Open this URL manually to sign in: ${authorizationUri}\n` +
        `(${(err as Error)?.message ?? err})`
    );
  }

  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<AccessToken>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Timed out waiting for login.')), LOGIN_TIMEOUT_MS);
  });

  const { token } = await Promise.race([tokenPromise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
    server.close();
  });

  // The token endpoint echoes back the scope it actually granted (RFC 6749 §5.1) — trust that over
  // what was merely requested, since Keycloak silently drops any scope not registered/grantable on
  // the client rather than erroring. Falls back to the requested list only if the field is absent
  // entirely (some environments/mocks don't echo it), rather than treating that as a hard failure.
  const grantedScopeField = token['scope'];
  const grantedScopes = typeof grantedScopeField === 'string' ? grantedScopeField.split(' ').filter(Boolean) : scopes;
  const missingScopes = scopes.filter((scope) => !grantedScopes.includes(scope));
  if (missingScopes.length > 0) {
    throw new Error(
      `Login succeeded, but the '${realm}' realm did not grant the requested scope(s): ${missingScopes.join(
        ', '
      )}. Check that they're registered as optional client scopes on that realm's adsp-cli client.`
    );
  }

  const expiresIn = (token['expires_in'] as number) ?? 300;
  setCachedToken(
    accessServiceUrl,
    realm,
    token['access_token'] as string,
    token['refresh_token'] as string | undefined,
    expiresIn,
    grantedScopes
  );

  return token['access_token'] as string;
}

export interface GetOrLoginResult {
  token: string;
  /** True if an already-valid cached token covering the requested scopes was reused, with no browser round-trip. */
  reused: boolean;
}

/** Cache-check first (scope-aware — see getCachedOrRefreshedToken), browser login on a miss — used for both the core-realm and final-realm steps. */
async function getOrLogin(accessServiceUrl: string, realm: string, scopes: string[]): Promise<GetOrLoginResult> {
  const cached = await getCachedOrRefreshedToken(accessServiceUrl, realm, scopes);
  if (cached) {
    return { token: cached, reused: true };
  }
  return { token: await browserLogin(accessServiceUrl, realm, scopes), reused: false };
}

async function promptForTenantRealm(directoryServiceUrl: string, coreToken: string): Promise<Tenant> {
  const tenants = await listTenants(directoryServiceUrl, coreToken);
  if (tenants.length === 0) {
    throw new Error('No tenants found.');
  }

  const choices = tenants.map((t) => t.name).sort((a, b) => a.localeCompare(b));
  const { prompt } = await import('enquirer');
  const { tenant: pickedName } = await prompt<{ tenant: string }>({
    type: 'autocomplete',
    name: 'tenant',
    message: 'Which tenant?',
    choices,
  });

  const picked = tenants.find((t) => t.name === pickedName);
  if (!picked) {
    throw new Error(`Tenant '${pickedName}' not found.`);
  }
  return picked;
}

/**
 * Best-effort reverse lookup for a --realm login, which doesn't already know the tenant's
 * display name the way --tenant/the interactive picker do. Never throws — a lookup failure just
 * leaves the name unresolved rather than blocking the login itself.
 */
async function resolveTenantName(directoryServiceUrl: string, realm: string): Promise<string | undefined> {
  try {
    const found = await findTenantByRealm(directoryServiceUrl, realm);
    return found?.name;
  } catch {
    return undefined;
  }
}

export interface LoginResult {
  realm: string;
  token: string;
  /** True if an already-valid cached token was reused with no browser round-trip at all. */
  reused: boolean;
}

/**
 * Full interactive login. Resolves a realm one of three ways — options.realm (direct), options.tenant
 * (anonymous name lookup), or neither (log into the core realm, then prompt interactively over the
 * full tenant list) — then logs into that realm and persists it as the current context
 * (~/.adsp-cli/config.json) so later getAccessToken() calls don't need ADSP_TENANT_REALM set at all.
 *
 * options.scopes requests additional OAuth scopes beyond the always-included 'email' (e.g.
 * 'adsp-cli-admin', see apps/tenant-management-api/src/keycloak/configuration.ts's
 * createAdspCliAdminClientScopeConfig). The cache is scope-aware (see tokenCache.ts's hasScopes,
 * used inside getCachedOrRefreshedToken/getOrLogin): a cached token only counts as usable if it
 * already covers the requested scopes, so asking for a scope not covered by what's cached always
 * triggers a fresh browser login for it — never a silent reuse of a narrower token.
 *
 * options.env selects which environment (dev/test/prod) this login talks to, overriding ADSP_ENV and
 * any previously-persisted environment for this one call. On success it's persisted alongside the
 * realm so later commands don't need ADSP_ENV set either; when omitted, whatever environment was
 * already persisted (or ADSP_ENV, or the 'prod' default) is left untouched rather than cleared.
 *
 * When called with neither realm/tenant/env option nor scopes (the plain "figure it out for me" case)
 * and the realm resolved by resolveTenantRealm() (env var or last-persisted config) already has a
 * valid cached token, this returns immediately — no core-realm login, no tenant listing, no prompt.
 * (This is safe without an explicit scope-coverage check: the only scope ever implied here is the
 * base 'email', which every cached token always has.) Any of --realm/--tenant/--scope/--env skips
 * this short-circuit, since each states an explicit ask rather than "who am I".
 *
 * Only ever invoked from the CLI entry (src/main.ts) — never call this from a library consumer,
 * since it can block for up to LOGIN_TIMEOUT_MS waiting on the browser.
 */
export async function loginInteractive(
  options: { realm?: string; tenant?: string; scopes?: string[]; env?: EnvironmentName } = {}
): Promise<LoginResult> {
  const { accessServiceUrl, directoryServiceUrl } = resolveEnvironmentUrls(options.env);
  const scopes = ['email', ...(options.scopes ?? [])];
  let realm = options.realm;
  let tenantName: string | undefined;

  if (!realm && !options.tenant && !options.scopes?.length && !options.env) {
    const current = resolveTenantRealm();
    if (current.ok) {
      const cached = getCachedToken(accessServiceUrl, current.tenantRealm);
      if (cached && !isExpired(cached)) {
        return { realm: current.tenantRealm, token: cached.accessToken, reused: true };
      }
    }
  }

  if (!realm && options.tenant) {
    const found = await findTenantByName(directoryServiceUrl, options.tenant);
    if (!found) {
      throw new Error(`Tenant '${options.tenant}' not found.`);
    }
    realm = found.realm;
    tenantName = found.name;
  }

  if (!realm) {
    // Only ever 'email' here, never the caller's extra requested scopes — core's adsp-cli client
    // doesn't have (and doesn't need) scopes like adsp-cli-admin registered; that scope is only
    // meaningful on the tenant-realm login below, once a realm is actually known.
    const core = await getOrLogin(accessServiceUrl, CORE_REALM, ['email']);
    const picked = await promptForTenantRealm(directoryServiceUrl, core.token);
    realm = picked.realm;
    tenantName = picked.name;
  }

  // --realm logins don't already know the display name the other two modes do — best-effort
  // resolve it so it can still be persisted/reported by `status`.
  if (!tenantName) {
    tenantName = await resolveTenantName(directoryServiceUrl, realm);
  }

  const final = await getOrLogin(accessServiceUrl, realm, scopes);
  writeConfig({ tenantRealm: realm, tenantName, env: options.env ?? readConfig()?.env });

  return { realm, token: final.token, reused: final.reused };
}

export interface LoginStatus {
  authenticated: boolean;
  realm?: string;
  realmSource?: 'env' | 'config';
  /** The tenant's display name, when it was resolvable at login time — see loginInteractive. */
  tenantName?: string;
  tokenState?: 'valid' | 'expired' | 'missing';
  env: EnvironmentName;
  envSource: 'env' | 'config' | 'default';
}

/**
 * Pure, read-only snapshot of the current session — no network calls, no cache mutation.
 * Used by the CLI's `status` command, and exported for library consumers (e.g. nx-adsp's
 * generator templates, which use the tenant name/realm) that want the same information.
 */
export function getStatus(): LoginStatus {
  const config = readConfig();
  const validEnvVar = process.env.ADSP_ENV === 'dev' || process.env.ADSP_ENV === 'test' || process.env.ADSP_ENV === 'prod';
  const envStatus: Pick<LoginStatus, 'env' | 'envSource'> = validEnvVar
    ? { env: resolveEnvironmentName(), envSource: 'env' }
    : config?.env
    ? { env: config.env, envSource: 'config' }
    : { env: 'prod', envSource: 'default' };

  const realmResolution = resolveTenantRealm();
  if (realmResolution.ok === false) {
    return { authenticated: false, ...envStatus };
  }

  const { accessServiceUrl } = resolveEnvironmentUrls();
  const cached = getCachedToken(accessServiceUrl, realmResolution.tenantRealm);
  const tokenState = !cached ? 'missing' : isExpired(cached) ? 'expired' : 'valid';
  const realmSource: 'env' | 'config' = process.env.ADSP_TENANT_REALM ? 'env' : 'config';

  return {
    authenticated: tokenState === 'valid',
    realm: realmResolution.tenantRealm,
    realmSource,
    // Only trust the persisted tenantName when the realm itself came from that same persisted
    // config — if ADSP_TENANT_REALM overrode the realm, config.json's tenantName may belong to a
    // different (stale) realm entirely.
    tenantName: realmSource === 'config' ? config?.tenantName : undefined,
    tokenState,
    ...envStatus,
  };
}

/** Clears the persisted realm and every cached token. Safe to call when already logged out. */
export function logout(): void {
  fs.rmSync(getConfigFilePath(), { force: true });
  fs.rmSync(getCacheFilePath(), { force: true });
}
