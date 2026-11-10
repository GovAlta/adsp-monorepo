import * as express from 'express';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import {
  AuthUnavailableError,
  createAuthMiddleware,
  createProtectedResourceMetadataHandler,
  createTokenVerifier,
  InvalidTokenError,
  MCP_AUDIENCE,
} from './auth';
import { AuthTestKit, createAuthTestKit } from './fixtures/authTestKit';
import { createMetricsTestKit, MetricsTestKit } from './fixtures/metricsTestKit';
import { installMetrics } from './metrics';

const REALM = '0b4bd0b4-2c4f-4c8f-9e3a-2f6b1c2d3e4f';
const OTHER_REALM = 'other-realm';

let kit: AuthTestKit;

beforeAll(async () => {
  kit = await createAuthTestKit();
});

afterAll(async () => {
  await kit.close();
});

describe('createTokenVerifier', () => {
  const verifier = () => createTokenVerifier({ accessServiceUrl: kit.accessServiceUrl, fetchTimeoutMs: 500 });

  it('accepts a token signed by the realm, for this server', async () => {
    const token = kit.sign(REALM, { sub: 'user-42', azp: 'adsp-mcp', scope: 'openid email' });

    const info = await verifier().verify(REALM, token);

    expect(info).toEqual({
      token,
      clientId: 'adsp-mcp',
      scopes: ['openid', 'email'],
      expiresAt: expect.any(Number),
      extra: { realm: REALM, sub: 'user-42' },
    });
  });

  it('uses the audience urn:ads:platform:adsp-sdk-mcp-server', () => {
    expect(MCP_AUDIENCE).toBe('urn:ads:platform:adsp-sdk-mcp-server');
  });

  it.each([
    ['expired', () => kit.sign(REALM, {}, { expiresIn: -120 })],
    ['not yet valid', () => kit.sign(REALM, {}, { notBefore: 300 })],
    ['for another audience', () => kit.sign(REALM, {}, { audience: 'urn:ads:platform:configuration-service' })],
    ['from another issuer', () => kit.sign(REALM, {}, { issuer: 'https://evil.example.test/auth/realms/' + REALM })],
    ['with an issuer that differs only by a trailing slash', () => kit.sign(REALM, {}, { issuer: kit.issuer(REALM) + '/' })],
    ['from another realm', () => kit.sign(OTHER_REALM)],
    ['unsigned (alg none)', () => kit.forge(REALM, 'none')],
    ['HS256-signed with the public key', () => kit.forge(REALM, 'HS256-with-public-key')],
    ['signed with an unknown key id', () => kit.sign(REALM, {}, { keyid: 'rotated-away' })],
    ['malformed', () => 'not.a.jwt'],
  ])('rejects a token that is %s', async (_description, token) => {
    await expect(verifier().verify(REALM, token())).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects an issuer mismatch without fetching any keys', async () => {
    const realm = 'no-fetch-realm';
    const before = kit.fetchCount(realm);

    await expect(verifier().verify(realm, kit.sign(OTHER_REALM))).rejects.toBeInstanceOf(InvalidTokenError);

    expect(kit.fetchCount(realm)).toBe(before);
  });

  it('caches keys, fetching them once for repeated tokens', async () => {
    const realm = 'cache-realm';
    const v = verifier();

    await v.verify(realm, kit.sign(realm));
    await v.verify(realm, kit.sign(realm));

    expect(kit.fetchCount(realm)).toBe(1);
  });

  it.each([
    ['missing', 'missing-realm'],
    ['down', 'down-realm'],
    ['hang', 'hang-realm'],
  ] as const)('reports keys as unavailable, with Retry-After, when the realm is %s', async (mode, realm) => {
    kit.setMode(realm, mode);
    const started = Date.now();

    const failure = await verifier()
      .verify(realm, kit.sign(realm))
      .catch((err) => err);

    expect(failure).toBeInstanceOf(AuthUnavailableError);
    expect((failure as AuthUnavailableError).retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('remembers a failing realm instead of fetching again on every request', async () => {
    const realm = 'flaky-realm';
    kit.setMode(realm, 'down');
    const v = verifier();

    await v.verify(realm, kit.sign(realm)).catch(() => undefined);
    await v.verify(realm, kit.sign(realm)).catch(() => undefined);

    expect(kit.fetchCount(realm)).toBe(1);
  });

  it('caps key fetches across all realms, so made-up realm names cost bounded traffic', async () => {
    const v = createTokenVerifier({ accessServiceUrl: kit.accessServiceUrl, maxFetchesPerMinute: 3, fetchTimeoutMs: 500 });
    const before = kit.fetchCount();
    const outcomes: unknown[] = [];

    for (let i = 0; i < 6; i++) {
      const realm = `random-${i}`;
      outcomes.push(await v.verify(realm, kit.sign(realm)).catch((err) => err));
    }

    expect(kit.fetchCount() - before).toBe(3);
    expect(outcomes.slice(3).every((outcome) => outcome instanceof AuthUnavailableError)).toBe(true);
  });

  it('keeps a bounded number of realms in memory', async () => {
    const v = createTokenVerifier({ accessServiceUrl: kit.accessServiceUrl, maxRealms: 2, fetchTimeoutMs: 500 });
    for (const realm of ['lru-a', 'lru-b', 'lru-c']) {
      await v.verify(realm, kit.sign(realm));
    }

    await v.verify('lru-a', kit.sign('lru-a'));

    expect(kit.fetchCount('lru-a')).toBe(2);
  });
});

describe('auth middleware and metadata', () => {
  const PUBLIC_URL = 'https://mcp.example.test';
  let server: HttpServer;
  let base: string;
  let metrics: MetricsTestKit;
  let uninstall: () => void;
  let consoleSpies: jest.SpyInstance[];

  beforeAll(async () => {
    const app = express();
    const verifier = createTokenVerifier({ accessServiceUrl: kit.accessServiceUrl, fetchTimeoutMs: 500 });
    app.post('/mcp/:tenantRealm', createAuthMiddleware({ verifier, publicUrl: PUBLIC_URL }), (req, res) => {
      res.json({ auth: (req as express.Request & { auth?: unknown }).auth });
    });
    app.get(
      '/.well-known/oauth-protected-resource/mcp/:tenantRealm',
      createProtectedResourceMetadataHandler({ publicUrl: PUBLIC_URL, accessServiceUrl: kit.accessServiceUrl })
    );
    server = await new Promise<HttpServer>((resolveListening) => {
      const listening = app.listen(0, '127.0.0.1', () => resolveListening(listening));
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolveClosed) => server.close(() => resolveClosed(undefined)));
  });

  beforeEach(() => {
    metrics = createMetricsTestKit();
    ({ uninstall } = installMetrics(metrics.provider));
    consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      jest.spyOn(console, level).mockImplementation(() => undefined)
    );
  });

  afterEach(async () => {
    consoleSpies.forEach((spy) => spy.mockRestore());
    uninstall();
    await metrics.shutdown();
  });

  const post = (realm: string, token?: string) =>
    fetch(`${base}/mcp/${realm}`, { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {} });

  async function rejectionReasons() {
    await metrics.collect();
    return metrics.points('mcp.requests.rejected').map((point) => [point.attributes['reason'], point.value]);
  }

  it('answers a request without a token with 401 and the metadata URL', async () => {
    const response = await post(REALM);

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe(
      `Bearer resource_metadata="${PUBLIC_URL}/.well-known/oauth-protected-resource/mcp/${REALM}"`
    );
    expect(await response.json()).toEqual({ jsonrpc: '2.0', error: { code: -32000, message: 'Sign-in required' }, id: null });
  });

  it('answers an invalid token with 401 invalid_token, and counts it', async () => {
    const response = await post(REALM, kit.sign(OTHER_REALM));

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe(
      `Bearer error="invalid_token", resource_metadata="${PUBLIC_URL}/.well-known/oauth-protected-resource/mcp/${REALM}"`
    );
    expect(await rejectionReasons()).toEqual([['auth', 1]]);
  });

  it('passes a valid token on as req.auth', async () => {
    const token = kit.sign(REALM);

    const response = await post(REALM, token);

    expect(response.status).toBe(200);
    expect((await response.json()).auth).toMatchObject({ token, clientId: 'adsp-mcp', extra: { realm: REALM } });
  });

  it('answers 503 with Retry-After when the realm keys cannot be fetched, and counts it', async () => {
    kit.setMode('middleware-down', 'down');

    const response = await post('middleware-down', kit.sign('middleware-down'));

    expect(response.status).toBe(503);
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect(await rejectionReasons()).toEqual([['auth_unavailable', 1]]);
  });

  it.each(['..', 'a.b', 'has space', '%2e%2e', 'x'.repeat(65), '-leading-dash'])(
    'answers 404 for the realm %p without fetching keys',
    async (realm) => {
      const before = kit.fetchCount();

      const response = await post(encodeURIComponent(realm), kit.sign(REALM));

      expect(response.status).toBe(404);
      expect(kit.fetchCount()).toBe(before);
    }
  );

  it('never logs the token', async () => {
    const token = kit.sign(OTHER_REALM);

    await post(REALM, token);
    kit.setMode('log-down', 'down');
    await post('log-down', kit.sign('log-down'));

    const logged = consoleSpies.flatMap((spy) => spy.mock.calls.flat().map(String)).join('\n');
    expect(logged).not.toContain(token.split('.')[1]);
  });

  it('serves the protected-resource metadata for the realm', async () => {
    const response = await fetch(`${base}/.well-known/oauth-protected-resource/mcp/${REALM}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      resource: `${PUBLIC_URL}/mcp/${REALM}`,
      authorization_servers: [kit.issuer(REALM)],
      bearer_methods_supported: ['header'],
      resource_name: 'ADSP SDK MCP server',
    });
  });

  it('answers 404 for metadata of an invalid realm name', async () => {
    const response = await fetch(`${base}/.well-known/oauth-protected-resource/mcp/a.b`);

    expect(response.status).toBe(404);
  });
});
