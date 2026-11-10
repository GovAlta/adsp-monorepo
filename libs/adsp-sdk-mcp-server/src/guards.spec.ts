import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { connect, AddressInfo } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
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
  waitFor,
} from './fixtures/httpTestKit';
import { createMetricsTestKit, MetricsTestKit } from './fixtures/metricsTestKit';
import { createMcpHttpApp, createMcpHttpServer } from './http';
import { installMetrics } from './metrics';
import * as quickstartModule from './tools/registerQuickstartTool';

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

  it('compares Origin exactly, without trimming the client value', async () => {
    await start();

    const trailingSlash = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: `${ALLOWED}/` });
    const manySlashes = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: `${ALLOWED}${'/'.repeat(8000)}x` });

    expect(trailingSlash.status).toBe(403);
    expect(manySlashes.status).toBe(403);
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

describe('in-flight gate', () => {
  const QUICKSTART_CALL = {
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: { name: 'get_platform_quickstart', arguments: {} },
  };
  let running: RunningApp;
  let docsRoot: string;
  let kit: MetricsTestKit;
  let uninstall: () => void;
  let unhandledRejection: jest.Mock;
  let handlerCalls: number;
  let releaseHeld: () => void;

  async function start(config: Partial<McpServerConfig>) {
    running = await listen(createMcpHttpApp({ docsRoot, config: testConfig({ rateLimitPerMinute: 0, ...config }) }));
  }

  function callHeldTool(signal?: AbortSignal): Promise<number> {
    return postMcp(running.endpoint, QUICKSTART_CALL, {}, signal).then(async (response) => {
      await response.text();
      return response.status;
    });
  }

  function inFlight(): unknown {
    return kit.points('mcp.requests.in_flight')[0]?.value;
  }

  const pause = (ms: number) => new Promise((resolveTick) => setTimeout(resolveTick, ms));

  beforeEach(() => {
    unhandledRejection = jest.fn();
    process.on('unhandledRejection', unhandledRejection);
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
    handlerCalls = 0;
    const held = new Promise<void>((resolve) => (releaseHeld = resolve));
    docsRoot = mkdtempSync(join(tmpdir(), 'adsp-gate-'));
    mkdirSync(join(docsRoot, 'services'));
    writeFileSync(join(docsRoot, 'services', 'event-service.md'), '---\ntitle: Event service\n---\n\nRoutes events.');
    jest.spyOn(quickstartModule, 'createQuickstartTool').mockReturnValue([
      {
        name: 'get_platform_quickstart',
        description: 'Quickstart that waits for the test.',
        inputSchema: { type: 'object' },
        handler: async () => {
          handlerCalls += 1;
          await held;
          return { content: [{ type: 'text', text: 'done' }] };
        },
      },
    ]);
  });

  afterEach(async () => {
    releaseHeld();
    await new Promise((resolveTick) => setImmediate(resolveTick));
    process.off('unhandledRejection', unhandledRejection);
    jest.restoreAllMocks();
    await stop(running);
    uninstall();
    await kit.shutdown();
    rmSync(docsRoot, { recursive: true, force: true });

    expect(unhandledRejection).not.toHaveBeenCalled();
  });

  it('lets a brief overflow wait and complete', async () => {
    await start({ maxInFlight: 2, inFlightWaitMs: 500 });

    const statuses = Promise.all([callHeldTool(), callHeldTool(), callHeldTool(), callHeldTool()]);
    await waitFor(() => handlerCalls === 2);
    setTimeout(releaseHeld, 100);

    expect(await statuses).toEqual([200, 200, 200, 200]);
    expect(handlerCalls).toBe(4);
  });

  it('answers 503 with Retry-After once the wait expires, and in-flight requests still complete', async () => {
    await start({ maxInFlight: 2, inFlightWaitMs: 100 });
    const held = [callHeldTool(), callHeldTool()];
    await waitFor(() => handlerCalls === 2);

    const rejected = await postMcp(running.endpoint, TOOLS_LIST_REQUEST);

    expect(rejected.status).toBe(503);
    expect(rejected.headers.get('retry-after')).toBe('1');
    expect(await rejected.json()).toEqual(JSON_RPC_ERROR('Server busy'));
    releaseHeld();
    expect(await Promise.all(held)).toEqual([200, 200]);
  });

  it('rejects at once when the wait queue is full', async () => {
    await start({ maxInFlight: 1, inFlightWaitMs: 5000 });
    const held = callHeldTool();
    await waitFor(() => handlerCalls === 1);
    const queued = callHeldTool();
    await pause(50);

    const started = Date.now();
    const rejected = await postMcp(running.endpoint, TOOLS_LIST_REQUEST);

    expect(rejected.status).toBe(503);
    expect(Date.now() - started).toBeLessThan(1000);
    releaseHeld();
    expect(await Promise.all([held, queued])).toEqual([200, 200]);
  });

  it('does not admit a queued request whose client disconnected', async () => {
    await start({ maxInFlight: 1, inFlightWaitMs: 5000 });
    const held = callHeldTool();
    await waitFor(() => handlerCalls === 1);
    const abort = new AbortController();
    const queued = callHeldTool(abort.signal).catch(() => 'aborted');
    await pause(50);

    abort.abort();
    expect(await queued).toBe('aborted');
    await pause(50);
    releaseHeld();
    expect(await held).toBe(200);
    await pause(50);

    await kit.collect();
    expect(handlerCalls).toBe(1);
    expect(inFlight()).toBe(0);
    expect((await postMcp(running.endpoint, TOOLS_LIST_REQUEST)).status).toBe(200);
  });

  it('releases the slot on every response path', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await start({ maxInFlight: 1, inFlightWaitMs: 200 });
    const raw = (body: string) =>
      fetch(running.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body,
      }).then(async (response) => {
        await response.text();
        return response.status;
      });
    const nextRequestStatus = async () => (await postMcp(running.endpoint, TOOLS_LIST_REQUEST)).status;

    expect(await raw('{bad')).toBe(400);
    expect(await nextRequestStatus()).toBe(200);

    expect(await raw(JSON.stringify({ ...TOOLS_LIST_REQUEST, padding: 'x'.repeat(1024 * 1024 + 1) }))).toBe(413);
    expect(await nextRequestStatus()).toBe(200);

    jest.spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest').mockRejectedValueOnce(new Error('boom'));
    expect(await raw(JSON.stringify(TOOLS_LIST_REQUEST))).toBe(500);
    expect(await nextRequestStatus()).toBe(200);

    const abort = new AbortController();
    const aborted = callHeldTool(abort.signal).catch(() => 'aborted');
    await waitFor(() => handlerCalls === 1);
    abort.abort();
    await aborted;
    await pause(50);
    expect(await nextRequestStatus()).toBe(200);

    await kit.collect();
    expect(inFlight()).toBe(0);
  });

  it('counts an in_flight_cap rejection', async () => {
    await start({ maxInFlight: 1, inFlightWaitMs: 50 });
    const held = callHeldTool();
    await waitFor(() => handlerCalls === 1);

    await (await postMcp(running.endpoint, TOOLS_LIST_REQUEST)).text();
    releaseHeld();
    await held;
    await kit.collect();

    expect(kit.points('mcp.requests.rejected').map((point) => [point.attributes['reason'], point.value])).toEqual([
      ['in_flight_cap', 1],
    ]);
  });

  it('does not gate /health', async () => {
    await start({ maxInFlight: 1, inFlightWaitMs: 50 });
    const held = callHeldTool();
    await waitFor(() => handlerCalls === 1);

    expect((await fetch(running.health)).status).toBe(200);
    releaseHeld();
    await held;
  });
});

describe('slow request bodies', () => {
  it('frees the slot of a client that never finishes sending its body', async () => {
    const app = createMcpHttpApp({
      docsRoot: FIXTURE_DOCS_ROOT,
      config: testConfig({ maxInFlight: 1, inFlightWaitMs: 100, rateLimitPerMinute: 0 }),
    });
    const httpServer = createMcpHttpServer(app, {
      requestTimeoutMs: 300,
      headersTimeoutMs: 200,
      connectionsCheckingIntervalMs: 50,
    });
    await new Promise<void>((resolveListening) => httpServer.listen(0, '127.0.0.1', resolveListening));
    const { port } = httpServer.address() as AddressInfo;
    const endpoint = new URL(`http://127.0.0.1:${port}/mcp`);
    const stalled = connect(port, '127.0.0.1');
    stalled.on('error', () => undefined);

    try {
      stalled.write(
        'POST /mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\n' +
          'Accept: application/json, text/event-stream\r\nContent-Length: 100\r\n\r\n{"jsonrpc":'
      );
      await new Promise((resolveTick) => setTimeout(resolveTick, 50));
      expect((await postMcp(endpoint, TOOLS_LIST_REQUEST)).status).toBe(503);

      await new Promise((resolveTick) => setTimeout(resolveTick, 600));

      expect((await postMcp(endpoint, TOOLS_LIST_REQUEST)).status).toBe(200);
    } finally {
      stalled.destroy();
      httpServer.closeAllConnections();
      await new Promise((resolveClosed) => httpServer.close(resolveClosed));
    }
  });

  it('uses request and header timeouts shorter than Node defaults', () => {
    const httpServer = createMcpHttpServer(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: testConfig() }));

    expect(httpServer.requestTimeout).toBe(30_000);
    expect(httpServer.headersTimeout).toBe(20_000);
  });
});
