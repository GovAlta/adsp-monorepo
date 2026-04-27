import { readFileSync } from 'node:fs';
import type { MastraFetchLike } from '@mastra/mcp';
import type { Logger } from 'winston';

const DEFAULT_TOKEN_EXPIRY_SECONDS = 300;
const TOKEN_EXPIRY_SKEW_MS = 30 * 1000;

interface OAuthClientCredentialsSecret {
  type: 'oauth-client-credentials';
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  audience?: string;
}

interface KnownMcpServerSecret {
  url: string;
  authentication?: OAuthClientCredentialsSecret;
}

interface KnownMcpServerCollection {
  servers?: KnownMcpServerSecret[];
}

interface AccessToken {
  authorization: string;
  expiresAt: number;
}

interface OAuthTokenResponse {
  access_token?: unknown;
  token_type?: unknown;
  expires_in?: unknown;
}

export function loadKnownMcpServerSecrets(filePath: string, logger: Logger) {
  if (!filePath) {
    return new Map<string, KnownMcpServerSecret>();
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content) as KnownMcpServerCollection;
    const servers = Array.isArray(parsed?.servers) ? parsed.servers : [];
    const knownServers = new Map<string, KnownMcpServerSecret>();

    for (const server of servers) {
      try {
        const normalizedUrl = normalizeMcpServerUrl(new URL(server.url));
        if (knownServers.has(normalizedUrl)) {
          logger.warn(`Ignoring duplicate known MCP server URL '${server.url}' from mounted credentials file.`, {
            context: 'AgentServiceConfiguration',
          });
          continue;
        }

        knownServers.set(normalizedUrl, server);
      } catch {
        logger.warn(`Ignoring invalid known MCP server URL '${server?.url}' from mounted credentials file.`, {
          context: 'AgentServiceConfiguration',
        });
      }
    }

    return knownServers;
  } catch (err) {
    logger.warn(`Failed to load mounted MCP credentials file '${filePath}'.`, {
      context: 'AgentServiceConfiguration',
      error: err instanceof Error ? err.message : String(err),
    });

    return new Map<string, KnownMcpServerSecret>();
  }
}

export function createAuthenticatedMcpFetch(
  authentication: OAuthClientCredentialsSecret,
  requestInit?: RequestInit,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): MastraFetchLike {
  let cachedToken: AccessToken | undefined;
  let pendingToken: Promise<AccessToken> | undefined;

  const getToken = async () => {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now) {
      return cachedToken.authorization;
    }

    if (!pendingToken) {
      pendingToken = requestAccessToken(authentication, fetchImpl)
        .then((token) => {
          cachedToken = token;
          return token;
        })
        .finally(() => {
          pendingToken = undefined;
        });
    }

    return (await pendingToken).authorization;
  };

  return async (url, init) => {
    const authorization = await getToken();
    const headers = new Headers(requestInit?.headers);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    headers.set('authorization', authorization);

    return fetchImpl(url, {
      ...requestInit,
      ...init,
      headers,
    });
  };
}

export function normalizeMcpServerUrl(url: URL) {
  const protocol = url.protocol.toLowerCase();
  const host = url.hostname.toLowerCase();
  const port = url.port ? `:${url.port}` : '';
  const path = url.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  return `${protocol}//${host}${port}${path}`;
}

async function requestAccessToken(authentication: OAuthClientCredentialsSecret, fetchImpl: typeof fetch) {
  const tokenEndpoint = new URL(authentication.tokenEndpoint);
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: authentication.clientId,
    client_secret: authentication.clientSecret,
  });

  if (authentication.scope) {
    body.set('scope', authentication.scope);
  }

  if (authentication.audience) {
    body.set('audience', authentication.audience);
  }

  const response = await fetchImpl(tokenEndpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Token endpoint request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OAuthTokenResponse;
  if (typeof payload.access_token !== 'string' || !payload.access_token) {
    throw new Error('Token endpoint response did not include an access_token.');
  }

  const tokenType = typeof payload.token_type === 'string' && payload.token_type ? payload.token_type : 'Bearer';
  const expiresInSeconds =
    typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in)
      ? payload.expires_in
      : DEFAULT_TOKEN_EXPIRY_SECONDS;

  return {
    authorization: `${tokenType} ${payload.access_token}`,
    expiresAt: Date.now() + Math.max(expiresInSeconds * 1000 - TOKEN_EXPIRY_SKEW_MS, 1000),
  } satisfies AccessToken;
}
