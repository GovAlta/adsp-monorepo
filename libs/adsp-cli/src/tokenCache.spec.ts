import { mkdtempSync, rmSync } from 'fs';
import * as os from 'os';
import { join } from 'path';
import { getCacheFilePath, getCachedToken, hasScopes, isExpired, setCachedToken } from './tokenCache';

describe('tokenCache', () => {
  let tempHome: string;
  let homedirSpy: jest.SpyInstance;

  beforeEach(() => {
    tempHome = mkdtempSync(join(os.tmpdir(), 'adsp-cli-test-'));
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome);
  });

  afterEach(() => {
    homedirSpy.mockRestore();
    rmSync(tempHome, { recursive: true, force: true });
  });

  it('getCacheFilePath resolves under the (mocked) home directory', () => {
    expect(getCacheFilePath()).toBe(join(tempHome, '.adsp-cli', 'token-cache.json'));
  });

  it('returns null for a cache miss', () => {
    expect(getCachedToken('https://access.example.com', 'my-realm')).toBeNull();
  });

  it('round-trips a cached token', () => {
    setCachedToken('https://access.example.com', 'my-realm', 'token-abc', 'refresh-abc', 300, ['email']);

    const cached = getCachedToken('https://access.example.com', 'my-realm');
    expect(cached?.accessToken).toBe('token-abc');
    expect(cached?.refreshToken).toBe('refresh-abc');
    expect(cached?.scopes).toEqual(['email']);
  });

  it('namespaces cache entries by accessServiceUrl and realm', () => {
    setCachedToken('https://access.example.com', 'realm-a', 'token-a', undefined, 300, ['email']);

    expect(getCachedToken('https://access.example.com', 'realm-b')).toBeNull();
    expect(getCachedToken('https://other.example.com', 'realm-a')).toBeNull();
    expect(getCachedToken('https://access.example.com', 'realm-a')?.accessToken).toBe('token-a');
  });

  it('isExpired is false for a token well within its TTL', () => {
    setCachedToken('https://access.example.com', 'my-realm', 'token-abc', undefined, 3600, ['email']);
    const cached = getCachedToken('https://access.example.com', 'my-realm');
    expect(isExpired(cached!)).toBe(false);
  });

  it('isExpired is true once past the expiry buffer', () => {
    setCachedToken('https://access.example.com', 'my-realm', 'token-abc', undefined, 30, ['email']);
    const cached = getCachedToken('https://access.example.com', 'my-realm');
    expect(isExpired(cached!)).toBe(true);
  });

  describe('hasScopes', () => {
    it('is true when every required scope is present', () => {
      setCachedToken('https://access.example.com', 'my-realm', 'token-abc', undefined, 3600, [
        'email',
        'adsp-cli-admin',
      ]);
      const cached = getCachedToken('https://access.example.com', 'my-realm')!;

      expect(hasScopes(cached, ['email'])).toBe(true);
      expect(hasScopes(cached, ['email', 'adsp-cli-admin'])).toBe(true);
    });

    it('is false when a required scope is missing', () => {
      setCachedToken('https://access.example.com', 'my-realm', 'token-abc', undefined, 3600, ['email']);
      const cached = getCachedToken('https://access.example.com', 'my-realm')!;

      expect(hasScopes(cached, ['email', 'adsp-cli-admin'])).toBe(false);
    });

    it('is trivially true for an empty requirement', () => {
      setCachedToken('https://access.example.com', 'my-realm', 'token-abc', undefined, 3600, ['email']);
      const cached = getCachedToken('https://access.example.com', 'my-realm')!;

      expect(hasScopes(cached, [])).toBe(true);
    });
  });
});
