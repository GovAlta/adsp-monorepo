import { McpServerConfig } from './config';
import { FIXTURE_DOCS_ROOT } from './fixtures/toolContract';
import {
  JSON_RPC_ERROR,
  listen,
  postMcp,
  RunningApp,
  stop,
  testConfig,
  TOOLS_LIST_REQUEST,
} from './fixtures/httpTestKit';
import { createMetricsTestKit, MetricsTestKit } from './fixtures/metricsTestKit';
import { createMcpHttpApp } from './http';
import { installMetrics } from './metrics';

const ALLOWED = 'http://allowed.test';

describe('Origin check', () => {
  let running: RunningApp;
  let kit: MetricsTestKit;
  let uninstall: () => void;

  async function start(config: Partial<McpServerConfig> = {}) {
    running = await listen(
      createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: testConfig({ corsOrigins: [ALLOWED], ...config }) })
    );
  }

  beforeEach(() => {
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
  });

  afterEach(async () => {
    await stop(running);
    uninstall();
    await kit.shutdown();
  });

  it('rejects a disallowed Origin with 403 and a JSON-RPC body', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'http://evil.test' });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(JSON_RPC_ERROR('Origin not allowed'));
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('rejects Origin: null', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'null' });

    expect(response.status).toBe(403);
  });

  it('allows a listed Origin and echoes it', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: ALLOWED });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED);
    expect(response.headers.get('vary')).toMatch(/Origin/i);
  });

  it('allows a request with no Origin and sends no Allow-Origin', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST);

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('rejects every Origin when no origins are configured', async () => {
    await start({ corsOrigins: [] });

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: ALLOWED });

    expect(response.status).toBe(403);
  });

  it('answers a preflight from an allowed Origin with 204 and the CORS headers', async () => {
    await start();

    const response = await fetch(running.endpoint, { method: 'OPTIONS', headers: { origin: ALLOWED } });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED);
    expect(response.headers.get('access-control-allow-headers')?.split(', ')).toContain('mcp-protocol-version');
  });

  it('answers a preflight from a disallowed Origin with 403', async () => {
    await start();

    const response = await fetch(running.endpoint, { method: 'OPTIONS', headers: { origin: 'http://evil.test' } });

    expect(response.status).toBe(403);
  });

  it('allows any Origin when CORS_ORIGIN is *', async () => {
    await start({ corsOrigins: '*' });

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'http://anything.test' });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('counts an origin rejection', async () => {
    await start();

    await (await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'http://evil.test' })).text();
    await kit.collect();

    expect(kit.points('mcp.requests.rejected').map((point) => [point.attributes['reason'], point.value])).toEqual([
      ['origin', 1],
    ]);
  });

  it('does not guard /health', async () => {
    await start();

    const response = await fetch(running.health, { headers: { origin: 'http://evil.test' } });

    expect(response.status).toBe(200);
  });
});

describe('rate limit', () => {
  let running: RunningApp;
  let kit: MetricsTestKit;
  let uninstall: () => void;

  async function start(config: Partial<McpServerConfig>) {
    running = await listen(
      createMcpHttpApp({
        docsRoot: FIXTURE_DOCS_ROOT,
        config: testConfig({ trustedProxy: 'loopback', corsOrigins: [ALLOWED], ...config }),
      })
    );
  }

  async function postFrom(clientIp: string, headers: Record<string, string> = {}) {
    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { 'x-forwarded-for': clientIp, ...headers });
    await response.clone().text();
    return response;
  }

  beforeEach(() => {
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await stop(running);
    uninstall();
    await kit.shutdown();
  });

  it('answers 429 with Retry-After and a JSON-RPC body once a client exceeds the limit', async () => {
    await start({ rateLimitPerMinute: 3 });

    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await postFrom('203.0.113.1')).status);
    const limited = await postFrom('203.0.113.1');

    expect(statuses).toEqual([200, 200, 200]);
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect(await limited.json()).toEqual(JSON_RPC_ERROR('Rate limit exceeded'));
  });

  it('keeps serving other clients while one is limited', async () => {
    await start({ rateLimitPerMinute: 1 });
    await postFrom('203.0.113.1');

    expect((await postFrom('203.0.113.1')).status).toBe(429);
    expect((await postFrom('203.0.113.2')).status).toBe(200);
  });

  it('ignores X-Forwarded-For from an untrusted peer', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await start({ rateLimitPerMinute: 1, trustedProxy: false });
    await postFrom('203.0.113.1');

    expect((await postFrom('203.0.113.2')).status).toBe(429);
  });

  it('counts a rate-limit rejection', async () => {
    await start({ rateLimitPerMinute: 1 });
    await postFrom('203.0.113.1');
    await postFrom('203.0.113.1');
    await kit.collect();

    expect(kit.points('mcp.requests.rejected').map((point) => [point.attributes['reason'], point.value])).toEqual([
      ['rate_limit', 1],
    ]);
  });

  it('disables the limit when the limit is 0', async () => {
    await start({ rateLimitPerMinute: 0 });

    const statuses = [];
    for (let i = 0; i < 5; i++) statuses.push((await postFrom('203.0.113.1')).status);

    expect(statuses).toEqual([200, 200, 200, 200, 200]);
  });

  it('sends CORS headers on a 429 for an allowed Origin', async () => {
    await start({ rateLimitPerMinute: 1 });
    await postFrom('203.0.113.1', { origin: ALLOWED });

    const limited = await postFrom('203.0.113.1', { origin: ALLOWED });

    expect(limited.status).toBe(429);
    expect(limited.headers.get('access-control-allow-origin')).toBe(ALLOWED);
  });

  it('does not rate-limit /health', async () => {
    await start({ rateLimitPerMinute: 1 });

    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await fetch(running.health)).status);

    expect(statuses).toEqual([200, 200, 200]);
  });
});
