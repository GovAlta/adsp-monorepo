import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface CacheEntry {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string; // ISO 8601
  scopes: string[];
}

type TokenCache = Record<string, CacheEntry>;

const EXPIRY_BUFFER_MS = 60_000;

export function getCacheFilePath(): string {
  return path.join(os.homedir(), '.adsp-cli', 'token-cache.json');
}

function readCache(): TokenCache {
  try {
    return JSON.parse(fs.readFileSync(getCacheFilePath(), 'utf-8')) as TokenCache;
  } catch {
    return {};
  }
}

function writeCache(cache: TokenCache): void {
  const filePath = getCacheFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), { mode: 0o600, encoding: 'utf-8' });
}

// Keyed by accessServiceUrl + realm so a tenant realm change (e.g. editing ADSP_TENANT_REALM)
// is naturally a cache miss rather than a stale hit for the wrong tenant.
function cacheKey(accessServiceUrl: string, realm: string): string {
  return `${accessServiceUrl}::${realm}`;
}

export function isExpired(entry: CacheEntry): boolean {
  return new Date(entry.expiresAt).getTime() - EXPIRY_BUFFER_MS < Date.now();
}

export function getCachedToken(accessServiceUrl: string, realm: string): CacheEntry | null {
  return readCache()[cacheKey(accessServiceUrl, realm)] ?? null;
}

export function setCachedToken(
  accessServiceUrl: string,
  realm: string,
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
  scopes: string[]
): void {
  const cache = readCache();
  cache[cacheKey(accessServiceUrl, realm)] = {
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scopes,
  };
  writeCache(cache);
}

/** Whether a cached entry's granted scopes cover every scope being requested now (a subset check, not exact match — a token granted with MORE scopes than currently needed still counts as covering the request). */
export function hasScopes(entry: CacheEntry, requiredScopes: string[]): boolean {
  return requiredScopes.every((scope) => entry.scopes.includes(scope));
}
