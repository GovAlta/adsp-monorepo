import { createHash } from 'crypto';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import * as os from 'os';
import { join } from 'path';

const mockAuthClient = {
  authorizeURL: jest.fn().mockReturnValue('https://access.example.com/auth/realms/my-realm/protocol/openid-connect/auth'),
  getToken: jest.fn(),
  createToken: jest.fn(),
};

jest.mock('simple-oauth2', () => ({
  AuthorizationCode: jest.fn().mockImplementation(() => mockAuthClient),
}));

const mockApp = {
  get: jest.fn(),
  listen: jest.fn(),
};

jest.mock('express', () => jest.fn(() => mockApp));

const mockOpen = jest.fn().mockResolvedValue(undefined);
jest.mock('open', () => mockOpen);

const mockPrompt = jest.fn();
jest.mock('enquirer', () => ({ prompt: mockPrompt }));

jest.mock('./tenants', () => ({
  findTenantByName: jest.fn(),
  findTenantByRealm: jest.fn(),
  listTenants: jest.fn(),
}));

// Imported after the mocks above so login.ts picks up the mocked modules.
import { getAccessToken, getStatus, loginInteractive, logout } from './login';
import { findTenantByName, findTenantByRealm, listTenants } from './tenants';
import { getConfigFilePath, readConfig, writeConfig } from './config';
import { getCacheFilePath, setCachedToken } from './tokenCache';
import { AuthorizationCode } from 'simple-oauth2';

const mockFindTenantByName = findTenantByName as jest.Mock;
const mockFindTenantByRealm = findTenantByRealm as jest.Mock;
const mockListTenants = listTenants as jest.Mock;
const mockAuthorizationCode = AuthorizationCode as unknown as jest.Mock;

const ACCESS_SERVICE_URL = 'https://access.example.com';
const REALM = 'my-realm';

function tokenPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    token: {
      access_token: 'fresh-access-token',
      refresh_token: 'fresh-refresh-token',
      expires_in: 300,
      ...overrides,
    },
  };
}

async function flushAsync(times = 5): Promise<void> {
  for (let i = 0; i < times; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

function lastCallbackHandler(): (req: unknown, res: unknown) => void {
  const [, handler] = mockApp.get.mock.calls.at(-1) as [string, (req: unknown, res: unknown) => void];
  return handler;
}

describe('login', () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(os.tmpdir(), 'adsp-cli-login-test-'));
    jest.spyOn(os, 'homedir').mockReturnValue(tempHome);

    delete process.env.ADSP_ACCESS_TOKEN;
    delete process.env.ADSP_ENV;
    delete process.env.ADSP_TENANT_REALM;
    delete process.env.ADSP_DIRECTORY_SERVICE_URL;
    process.env.ADSP_ACCESS_SERVICE_URL = ACCESS_SERVICE_URL;

    mockAuthClient.getToken.mockReset();
    mockAuthClient.createToken.mockReset();
    mockApp.get.mockReset();
    mockApp.listen.mockReset().mockReturnValue({ close: jest.fn() });
    mockOpen.mockReset().mockResolvedValue(undefined);
    mockPrompt.mockReset();
    mockFindTenantByName.mockReset();
    mockFindTenantByRealm.mockReset();
    mockListTenants.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    rmSync(tempHome, { recursive: true, force: true });
    delete process.env.ADSP_ACCESS_SERVICE_URL;
    delete process.env.ADSP_TENANT_REALM;
    delete process.env.ADSP_ACCESS_TOKEN;
    delete process.env.ADSP_ENV;
    delete process.env.ADSP_DIRECTORY_SERVICE_URL;
  });

  describe('getAccessToken', () => {
    it('returns the ADSP_ACCESS_TOKEN escape hatch directly, without touching the cache', async () => {
      process.env.ADSP_ACCESS_TOKEN = 'escape-hatch-token';

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'ok', token: 'escape-hatch-token' });
    });

    it('prefers the escape hatch even when a persisted realm config exists', async () => {
      writeConfig({ tenantRealm: REALM });
      process.env.ADSP_ACCESS_TOKEN = 'escape-hatch-token';

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'ok', token: 'escape-hatch-token' });
    });

    it('returns not-authenticated when no realm is configured at all (no env var, no persisted config)', async () => {
      const result = await getAccessToken();

      expect(result).toEqual({ status: 'not-authenticated' });
    });

    it('returns not-authenticated when there is no cached token for a configured realm', async () => {
      process.env.ADSP_TENANT_REALM = REALM;

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'not-authenticated' });
    });

    it('returns the cached token when it is still valid (realm via env var)', async () => {
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', 'cached-refresh', 3600, ['email']);

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'ok', token: 'cached-token' });
      expect(mockAuthClient.createToken).not.toHaveBeenCalled();
    });

    it('returns the cached token when the realm comes from persisted config, not an env var', async () => {
      writeConfig({ tenantRealm: REALM });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'ok', token: 'cached-token' });
    });

    it('prefers the ADSP_TENANT_REALM env var over a persisted config realm', async () => {
      writeConfig({ tenantRealm: 'other-realm' });
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'ok', token: 'cached-token' });
    });

    it('refreshes and returns a new token when the cached one is expired', async () => {
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'stale-token', 'stale-refresh', 30, ['email']);
      mockAuthClient.createToken.mockReturnValue({ refresh: jest.fn().mockResolvedValue(tokenPayload()) });

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'ok', token: 'fresh-access-token' });
    });

    it('returns not-authenticated when refresh fails', async () => {
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'stale-token', 'stale-refresh', 30, ['email']);
      mockAuthClient.createToken.mockReturnValue({ refresh: jest.fn().mockRejectedValue(new Error('refresh failed')) });

      const result = await getAccessToken();

      expect(result).toEqual({ status: 'not-authenticated' });
    });

    it('returns the cached token when it covers a requested elevated scope', async () => {
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email', 'adsp-cli-admin']);

      const result = await getAccessToken({ scopes: ['adsp-cli-admin'] });

      expect(result).toEqual({ status: 'ok', token: 'cached-token' });
    });

    it('returns not-authenticated (never opening a browser) when the cached token does not cover a requested elevated scope', async () => {
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      const result = await getAccessToken({ scopes: ['adsp-cli-admin'] });

      expect(result).toEqual({ status: 'not-authenticated' });
      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('loginInteractive with an explicit realm', () => {
    it('logs in directly without any tenant lookup, and persists the realm on success', async () => {
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result).toEqual({ realm: REALM, token: 'fresh-access-token', reused: false });
      expect(mockFindTenantByName).not.toHaveBeenCalled();
      expect(mockListTenants).not.toHaveBeenCalled();
      expect(mockFindTenantByRealm).toHaveBeenCalledWith(expect.any(String), REALM);
      expect(readConfig()).toEqual({ tenantRealm: REALM });
    });

    it('best-effort resolves and persists the tenant name via a reverse lookup, since --realm alone does not have it', async () => {
      mockFindTenantByRealm.mockResolvedValue({ name: 'my-tenant', realm: REALM });
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });
      await loginPromise;

      expect(readConfig()).toEqual({ tenantRealm: REALM, tenantName: 'my-tenant' });
    });

    it('still logs in successfully when the reverse tenant-name lookup fails', async () => {
      mockFindTenantByRealm.mockRejectedValue(new Error('network error'));
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result).toEqual({ realm: REALM, token: 'fresh-access-token', reused: false });
      expect(readConfig()).toEqual({ tenantRealm: REALM });
    });

    it('persists a newly-given --env, and preserves a previously-persisted env on a later plain login', async () => {
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const firstLogin = loginInteractive({ realm: REALM, env: 'dev' });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });
      await firstLogin;

      expect(readConfig()).toEqual({ tenantRealm: REALM, env: 'dev' });

      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);
      await loginInteractive({ realm: REALM });

      expect(readConfig()).toEqual({ tenantRealm: REALM, env: 'dev' });
    });

    it('uses PKCE: the code_challenge sent to authorizeURL matches the code_verifier sent to getToken', async () => {
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });
      await loginPromise;

      const [authorizeArgs] = mockAuthClient.authorizeURL.mock.calls.at(-1);
      const [tokenArgs] = mockAuthClient.getToken.mock.calls.at(-1);

      expect(authorizeArgs.code_challenge_method).toBe('S256');
      expect(typeof authorizeArgs.code_challenge).toBe('string');
      expect(tokenArgs.code_verifier).toBeTruthy();
      expect(createHash('sha256').update(tokenArgs.code_verifier).digest('base64url')).toBe(
        authorizeArgs.code_challenge
      );
    });

    it('reuses a valid cached token covering the requested scopes without opening a browser', async () => {
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      const result = await loginInteractive({ realm: REALM });

      expect(result).toEqual({ realm: REALM, token: 'cached-token', reused: true });
      expect(mockOpen).not.toHaveBeenCalled();
      expect(mockApp.listen).not.toHaveBeenCalled();
    });

    it('requests only the email scope by default', async () => {
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });
      await loginPromise;

      const [authorizeArgs] = mockAuthClient.authorizeURL.mock.calls.at(-1);
      expect(authorizeArgs.scope).toEqual(['email']);
    });

    it('requests additional scopes on top of email when options.scopes is given', async () => {
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM, scopes: ['adsp-cli-admin'] });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });
      await loginPromise;

      const [authorizeArgs] = mockAuthClient.authorizeURL.mock.calls.at(-1);
      expect(authorizeArgs.scope).toEqual(['email', 'adsp-cli-admin']);
    });

    it('forces a fresh browser login when the cached token does not cover a newly requested scope', async () => {
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM, scopes: ['adsp-cli-admin'] });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result).toEqual({ realm: REALM, token: 'fresh-access-token', reused: false });
      expect(mockOpen).toHaveBeenCalled();

      const [authorizeArgs] = mockAuthClient.authorizeURL.mock.calls.at(-1);
      expect(authorizeArgs.scope).toEqual(['email', 'adsp-cli-admin']);
    });

    it('reuses a cached token that already covers the newly requested scope, without a fresh browser login', async () => {
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email', 'adsp-cli-admin']);

      const result = await loginInteractive({ realm: REALM, scopes: ['adsp-cli-admin'] });

      expect(result).toEqual({ realm: REALM, token: 'cached-token', reused: true });
      expect(mockOpen).not.toHaveBeenCalled();
    });

    it('resolves accessServiceUrl from options.env when no ADSP_ACCESS_SERVICE_URL override is set', async () => {
      delete process.env.ADSP_ACCESS_SERVICE_URL;
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM, env: 'dev' });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });
      await loginPromise;

      const [clientConfig] = mockAuthorizationCode.mock.calls.at(-1);
      expect(clientConfig.auth.tokenHost).toBe('https://access.adsp-dev.gov.ab.ca');
    });
  });

  describe('loginInteractive with an explicit tenant name', () => {
    it('resolves the realm via an anonymous lookup, then logs in', async () => {
      mockFindTenantByName.mockResolvedValue({ name: 'my-tenant', realm: REALM });
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ tenant: 'my-tenant' });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result).toEqual({ realm: REALM, token: 'fresh-access-token', reused: false });
      expect(mockFindTenantByName).toHaveBeenCalledWith(expect.any(String), 'my-tenant');
      expect(mockListTenants).not.toHaveBeenCalled();
      expect(readConfig()).toEqual({ tenantRealm: REALM, tenantName: 'my-tenant' });
      expect(mockFindTenantByRealm).not.toHaveBeenCalled();
    });

    it('throws when the tenant name is not found', async () => {
      mockFindTenantByName.mockResolvedValue(null);

      await expect(loginInteractive({ tenant: 'unknown-tenant' })).rejects.toThrow(
        "Tenant 'unknown-tenant' not found."
      );
    });

    it('--realm wins if both --realm and --tenant are given', async () => {
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ realm: REALM, tenant: 'my-tenant' });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'auth-code' } }, { send: jest.fn() });
      await loginPromise;

      expect(mockFindTenantByName).not.toHaveBeenCalled();
    });
  });

  describe('loginInteractive with no options — interactive tenant selection', () => {
    it('logs into core, lists tenants, prompts, then logs into the picked realm', async () => {
      mockListTenants.mockResolvedValue([
        { name: 'tenant-b', realm: 'realm-b' },
        { name: 'tenant-a', realm: 'realm-a' },
      ]);
      mockPrompt.mockResolvedValue({ tenant: 'tenant-a' });
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive();

      // First browser round-trip: core realm login.
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'core-auth-code' } }, { send: jest.fn() });

      // Second browser round-trip: the resolved tenant realm.
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'tenant-auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result).toEqual({ realm: 'realm-a', token: 'fresh-access-token', reused: false });
      expect(mockListTenants).toHaveBeenCalledWith(expect.any(String), 'fresh-access-token');
      expect(mockPrompt).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'autocomplete', choices: ['tenant-a', 'tenant-b'] })
      );
      expect(readConfig()).toEqual({ tenantRealm: 'realm-a', tenantName: 'tenant-a' });
      expect(mockFindTenantByRealm).not.toHaveBeenCalled();
    });

    it('short-circuits entirely when the persisted realm already has a valid cached token', async () => {
      writeConfig({ tenantRealm: REALM });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      const result = await loginInteractive();

      expect(result).toEqual({ realm: REALM, token: 'cached-token', reused: true });
      expect(mockListTenants).not.toHaveBeenCalled();
      expect(mockPrompt).not.toHaveBeenCalled();
      expect(mockOpen).not.toHaveBeenCalled();
    });

    it('does not short-circuit when scopes are requested, even with an otherwise-valid cached token', async () => {
      writeConfig({ tenantRealm: REALM });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);
      // Pre-cache a token for the tenant realm the picker will resolve to, covering the requested
      // scope, so this test only needs to drive one browser round-trip (core) to prove the
      // short-circuit was bypassed — the final tenant-realm step is a genuine (scope-covered) cache hit.
      setCachedToken(ACCESS_SERVICE_URL, 'realm-a', 'cached-tenant-token', undefined, 3600, [
        'email',
        'adsp-cli-admin',
      ]);
      mockListTenants.mockResolvedValue([{ name: 'tenant-a', realm: 'realm-a' }]);
      mockPrompt.mockResolvedValue({ tenant: 'tenant-a' });
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ scopes: ['adsp-cli-admin'] });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'core-auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result).toEqual({ realm: 'realm-a', token: 'cached-tenant-token', reused: true });
      expect(mockListTenants).toHaveBeenCalled();
    });

    it('does not short-circuit when env is requested, even with an otherwise-valid cached token', async () => {
      writeConfig({ tenantRealm: REALM });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);
      setCachedToken(ACCESS_SERVICE_URL, 'realm-a', 'cached-tenant-token', undefined, 3600, ['email']);
      mockListTenants.mockResolvedValue([{ name: 'tenant-a', realm: 'realm-a' }]);
      mockPrompt.mockResolvedValue({ tenant: 'tenant-a' });
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive({ env: 'prod' });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'core-auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result).toEqual({ realm: 'realm-a', token: 'cached-tenant-token', reused: true });
      expect(mockListTenants).toHaveBeenCalled();
    });

    it('short-circuits using ADSP_TENANT_REALM when set, over a stale persisted config', async () => {
      writeConfig({ tenantRealm: 'other-realm' });
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      const result = await loginInteractive();

      expect(result).toEqual({ realm: REALM, token: 'cached-token', reused: true });
      expect(mockListTenants).not.toHaveBeenCalled();
    });

    it('falls through to the full flow when the persisted realm has no cached token', async () => {
      writeConfig({ tenantRealm: REALM });
      mockListTenants.mockResolvedValue([{ name: 'tenant-a', realm: 'realm-a' }]);
      mockPrompt.mockResolvedValue({ tenant: 'tenant-a' });
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive();
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'core-auth-code' } }, { send: jest.fn() });
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'tenant-auth-code' } }, { send: jest.fn() });

      const result = await loginPromise;

      expect(result.reused).toBe(false);
      expect(mockListTenants).toHaveBeenCalled();
    });

    it('throws when no tenants are found', async () => {
      mockListTenants.mockResolvedValue([]);
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive();
      await flushAsync();
      lastCallbackHandler()({ query: { code: 'core-auth-code' } }, { send: jest.fn() });

      await expect(loginPromise).rejects.toThrow('No tenants found.');
    });

    it('skips the core browser hop if a valid core token is already cached', async () => {
      setCachedToken(ACCESS_SERVICE_URL, 'core', 'cached-core-token', undefined, 3600, ['email']);
      mockListTenants.mockResolvedValue([{ name: 'tenant-a', realm: 'realm-a' }]);
      mockPrompt.mockResolvedValue({ tenant: 'tenant-a' });
      mockAuthClient.getToken.mockResolvedValue(tokenPayload());

      const loginPromise = loginInteractive();
      await flushAsync();
      // Only one browser round-trip needed now — for the tenant realm.
      lastCallbackHandler()({ query: { code: 'tenant-auth-code' } }, { send: jest.fn() });
      await loginPromise;

      expect(mockListTenants).toHaveBeenCalledWith(expect.any(String), 'cached-core-token');
      expect(mockApp.listen).toHaveBeenCalledTimes(1);
    });
  });

  describe('browser flow error handling', () => {
    it('rejects when the callback receives an error query param', async () => {
      const loginPromise = loginInteractive({ realm: REALM });
      await flushAsync();
      const res = { send: jest.fn() };
      lastCallbackHandler()({ query: { error: 'access_denied' } }, res);

      await expect(loginPromise).rejects.toThrow('access_denied');
      expect(res.send).toHaveBeenCalledWith('Login failed.');
    });

    it('surfaces the authorization URL for manual copy-paste when open() fails', async () => {
      mockOpen.mockRejectedValue(new Error('no display'));

      let caughtError: Error | undefined;
      try {
        await loginInteractive({ realm: REALM });
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError?.message).toContain('Open this URL manually to sign in');
      expect(caughtError?.message).toContain(mockAuthClient.authorizeURL());
    });

    it('times out if the browser flow never completes', async () => {
      jest.useFakeTimers();

      const loginPromise = loginInteractive({ realm: REALM });
      const assertion = expect(loginPromise).rejects.toThrow('Timed out waiting for login.');

      await jest.advanceTimersByTimeAsync(120_000);
      await assertion;
    });
  });

  describe('getStatus', () => {
    it('reports not authenticated when no realm is configured at all', () => {
      expect(getStatus()).toEqual({ authenticated: false, env: 'prod', envSource: 'default' });
    });

    it('reports an env-sourced realm with a valid token', () => {
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      expect(getStatus()).toEqual({
        authenticated: true,
        realm: REALM,
        realmSource: 'env',
        tokenState: 'valid',
        env: 'prod',
        envSource: 'default',
      });
    });

    it('reports a config-sourced realm with an expired token', () => {
      writeConfig({ tenantRealm: REALM });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'stale-token', undefined, -1, ['email']);

      expect(getStatus()).toEqual({
        authenticated: false,
        realm: REALM,
        realmSource: 'config',
        tokenState: 'expired',
        env: 'prod',
        envSource: 'default',
      });
    });

    it('reports a resolved realm with no cached token at all', () => {
      writeConfig({ tenantRealm: REALM });

      expect(getStatus()).toEqual({
        authenticated: false,
        realm: REALM,
        realmSource: 'config',
        tokenState: 'missing',
        env: 'prod',
        envSource: 'default',
      });
    });

    it('reports an env-sourced environment when ADSP_ENV is set', () => {
      process.env.ADSP_ENV = 'dev';

      expect(getStatus()).toEqual({ authenticated: false, env: 'dev', envSource: 'env' });
    });

    it('reports a config-sourced environment when persisted by a prior login --env', () => {
      writeConfig({ tenantRealm: REALM, env: 'test' });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      expect(getStatus()).toEqual({
        authenticated: true,
        realm: REALM,
        realmSource: 'config',
        tokenState: 'valid',
        env: 'test',
        envSource: 'config',
      });
    });

    it('reports the persisted tenant name when the realm itself came from that same persisted config', () => {
      writeConfig({ tenantRealm: REALM, tenantName: 'My Tenant' });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      expect(getStatus()).toMatchObject({ realm: REALM, tenantName: 'My Tenant' });
    });

    it('does not report a tenant name when ADSP_TENANT_REALM overrides the persisted realm, even if config has one', () => {
      writeConfig({ tenantRealm: 'other-realm', tenantName: 'Some Other Tenant' });
      process.env.ADSP_TENANT_REALM = REALM;
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      const status = getStatus();

      expect(status.realm).toBe(REALM);
      expect(status.realmSource).toBe('env');
      expect(status.tenantName).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('removes the persisted config and token cache files', () => {
      writeConfig({ tenantRealm: REALM });
      setCachedToken(ACCESS_SERVICE_URL, REALM, 'cached-token', undefined, 3600, ['email']);

      logout();

      expect(existsSync(getConfigFilePath())).toBe(false);
      expect(existsSync(getCacheFilePath())).toBe(false);
    });

    it('is a no-op when already logged out', () => {
      expect(() => logout()).not.toThrow();
    });
  });
});
