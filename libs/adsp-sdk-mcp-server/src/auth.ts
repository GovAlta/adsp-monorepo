import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type * as express from 'express';
import { decode, JwtPayload, verify } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { sendJsonRpcError } from './guards';
import { getMetrics } from './metrics';

export const MCP_AUDIENCE = 'urn:ads:platform:adsp-sdk-mcp-server';

/** New realms are UUIDs; older ones are simple names. Anything else never reaches a URL. */
export const REALM_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

const FETCH_WINDOW_MS = 60_000;
const KEY_CACHE_MS = 10 * 60_000;
const CLOCK_TOLERANCE_SECONDS = 30;
const REFETCH_MIN_MS = 30_000;

interface RealmKeys {
  keys: Map<string, string>;
  fetchedAt: number;
}

/** A token without a kid can only match a realm that publishes a single key. */
function keyById({ keys }: RealmKeys, kid: string | undefined): string | undefined {
  if (kid !== undefined) {
    return keys.get(kid);
  }
  return keys.size === 1 ? keys.values().next().value : undefined;
}

export class InvalidTokenError extends Error {}

export class AuthUnavailableError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Sign-in keys are unavailable');
  }
}

export interface TokenVerifierOptions {
  accessServiceUrl: string;
  maxRealms?: number;
  negativeCacheMs?: number;
  maxFetchesPerMinute?: number;
  fetchTimeoutMs?: number;
  keyCacheMs?: number;
  refetchMinMs?: number;
}

export interface TokenVerifier {
  verify(realm: string, token: string): Promise<AuthInfo>;
}

function retryAfter(untilMs: number): number {
  return Math.max(1, Math.ceil((untilMs - Date.now()) / 1000));
}

export function createTokenVerifier({
  accessServiceUrl,
  maxRealms = 100,
  negativeCacheMs = 60_000,
  maxFetchesPerMinute = 20,
  fetchTimeoutMs = 5_000,
  keyCacheMs = KEY_CACHE_MS,
  refetchMinMs = REFETCH_MIN_MS,
}: TokenVerifierOptions): TokenVerifier {
  // Insertion-ordered maps used as LRUs, so a stream of made-up realm names can't grow memory without bound.
  // Only realms whose keys were fetched successfully enter realmKeys, so made-up realms can't evict real ones.
  const realmKeys = new Map<string, RealmKeys>();
  const unavailableUntil = new Map<string, number>();
  const pendingFetches = new Map<string, Promise<RealmKeys>>();
  const fetchTimes: number[] = [];

  const issuerFor = (realm: string) => `${accessServiceUrl}/auth/realms/${realm}`;

  function remember<V>(map: Map<string, V>, key: string, value: V): void {
    map.delete(key);
    map.set(key, value);
    if (map.size > maxRealms) {
      map.delete(map.keys().next().value as string);
    }
  }

  async function fetchJwks(uri: string): Promise<{ keys: unknown[] }> {
    const now = Date.now();
    while (fetchTimes.length > 0 && fetchTimes[0] <= now - FETCH_WINDOW_MS) {
      fetchTimes.shift();
    }
    if (fetchTimes.length >= maxFetchesPerMinute) {
      throw new AuthUnavailableError(retryAfter(fetchTimes[0] + FETCH_WINDOW_MS));
    }
    fetchTimes.push(now);

    const response = await fetch(uri, { signal: AbortSignal.timeout(fetchTimeoutMs) });
    if (!response.ok) {
      throw new Error(`JWKS request failed with status ${response.status}`);
    }
    // JSON.parse rather than response.json(): jose rejects objects built in another realm (e.g. Jest's sandbox).
    return JSON.parse(await response.text()) as { keys: unknown[] };
  }

  function refreshKeys(realm: string): Promise<RealmKeys> {
    const pending = pendingFetches.get(realm);
    if (pending) {
      return pending;
    }
    const client = new JwksClient({ jwksUri: `${issuerFor(realm)}/protocol/openid-connect/certs`, fetcher: fetchJwks });
    const fetching = client
      .getSigningKeys()
      .then((signingKeys) => {
        const fresh = { keys: new Map(signingKeys.map((key) => [key.kid, key.getPublicKey()])), fetchedAt: Date.now() };
        remember(realmKeys, realm, fresh);
        unavailableUntil.delete(realm);
        return fresh;
      })
      .finally(() => pendingFetches.delete(realm));
    pendingFetches.set(realm, fetching);
    return fetching;
  }

  async function signingKeyFor(realm: string, kid: string | undefined): Promise<string> {
    const known = realmKeys.get(realm);
    if (known) {
      remember(realmKeys, realm, known);
    }
    const knownKey = known && keyById(known, kid);
    const age = known ? Date.now() - known.fetchedAt : Infinity;
    if (knownKey && age < keyCacheMs) {
      return knownKey;
    }
    // Refetching for every unknown kid would let junk tokens spend the shared fetch budget.
    if (known && !knownKey && age < refetchMinMs) {
      throw new InvalidTokenError('Unknown signing key');
    }

    const blockedUntil = unavailableUntil.get(realm);
    if (blockedUntil !== undefined && blockedUntil > Date.now()) {
      if (knownKey) {
        return knownKey;
      }
      throw new AuthUnavailableError(retryAfter(blockedUntil));
    }

    let latest: RealmKeys;
    try {
      latest = await refreshKeys(realm);
    } catch (err) {
      let unavailable = err;
      if (!(err instanceof AuthUnavailableError)) {
        const until = Date.now() + negativeCacheMs;
        remember(unavailableUntil, realm, until);
        console.error(`[adsp-sdk-mcp-server] Could not fetch sign-in keys for realm ${realm}.`);
        unavailable = new AuthUnavailableError(retryAfter(until));
      }
      // Stale keys beat refusing every sign-in for the realm while Keycloak is unreachable.
      if (knownKey) {
        return knownKey;
      }
      throw unavailable;
    }

    const key = keyById(latest, kid);
    if (!key) {
      throw new InvalidTokenError('Unknown signing key');
    }
    return key;
  }

  return {
    async verify(realm, token) {
      const decoded = decode(token, { complete: true });
      if (!decoded || typeof decoded.payload === 'string') {
        throw new InvalidTokenError('Malformed token');
      }
      const issuer = issuerFor(realm);
      // Checked before any key fetch, so a token for another realm or issuer costs no outbound request.
      if (decoded.payload.iss !== issuer || decoded.header.alg !== 'RS256') {
        throw new InvalidTokenError('Token is not for this realm');
      }

      const key = await signingKeyFor(realm, decoded.header.kid);
      let payload: JwtPayload;
      try {
        payload = verify(token, key, {
          algorithms: ['RS256'],
          issuer,
          audience: MCP_AUDIENCE,
          clockTolerance: CLOCK_TOLERANCE_SECONDS,
        }) as JwtPayload;
      } catch {
        throw new InvalidTokenError('Token verification failed');
      }

      return {
        token,
        clientId: typeof payload['azp'] === 'string' ? payload['azp'] : '',
        scopes: typeof payload['scope'] === 'string' ? payload['scope'].split(' ').filter(Boolean) : [],
        expiresAt: payload.exp,
        extra: { realm, sub: payload.sub },
      };
    },
  };
}

function metadataUrl(publicUrl: string, realm: string): string {
  return `${publicUrl}/.well-known/oauth-protected-resource/mcp/${realm}`;
}

/** Expects the realm in `req.params.tenantRealm`; sets `req.auth` for the MCP transport. */
export function createAuthMiddleware({
  verifier,
  publicUrl,
}: {
  verifier: TokenVerifier;
  publicUrl: string;
}): express.RequestHandler {
  return async (req, res, next) => {
    const realm = req.params['tenantRealm'];
    if (!REALM_PATTERN.test(realm)) {
      sendJsonRpcError(res, 404, 'Unknown tenant realm');
      return;
    }

    const resourceMetadata = `resource_metadata="${metadataUrl(publicUrl, realm)}"`;
    const token = /^Bearer\s+(\S+)\s*$/i.exec(req.headers.authorization ?? '')?.[1] ?? '';
    if (!token) {
      res.setHeader('WWW-Authenticate', `Bearer ${resourceMetadata}`);
      sendJsonRpcError(res, 401, 'Sign-in required');
      return;
    }

    try {
      (req as express.Request & { auth?: AuthInfo }).auth = await verifier.verify(realm, token);
      next();
    } catch (err) {
      if (err instanceof AuthUnavailableError) {
        getMetrics().recordRejection('auth_unavailable');
        res.setHeader('Retry-After', String(err.retryAfterSeconds));
        sendJsonRpcError(res, 503, 'Sign-in is temporarily unavailable');
        return;
      }
      getMetrics().recordRejection('auth');
      res.setHeader('WWW-Authenticate', `Bearer error="invalid_token", ${resourceMetadata}`);
      sendJsonRpcError(res, 401, 'Sign-in rejected or expired');
    }
  };
}

/** RFC 9728 protected-resource metadata, built only from configuration, never from request headers. */
export function createProtectedResourceMetadataHandler({
  publicUrl,
  accessServiceUrl,
}: {
  publicUrl: string;
  accessServiceUrl: string;
}): express.RequestHandler {
  return (req, res) => {
    const realm = req.params['tenantRealm'];
    if (!REALM_PATTERN.test(realm)) {
      sendJsonRpcError(res, 404, 'Unknown tenant realm');
      return;
    }
    res.json({
      resource: `${publicUrl}/mcp/${realm}`,
      authorization_servers: [`${accessServiceUrl}/auth/realms/${realm}`],
      bearer_methods_supported: ['header'],
      resource_name: 'ADSP SDK MCP server',
    });
  };
}
