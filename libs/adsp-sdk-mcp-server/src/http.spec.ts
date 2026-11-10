import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import type { Express } from 'express';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import {
  callForContract,
  connectInMemoryClient,
  FIXTURE_DOCS_ROOT,
  TOOL_CONTRACT,
  TRANSPORT_EQUIVALENCE_CALLS,
} from './fixtures/toolContract';
import { createMetricsTestKit, histogramCount, MetricsTestKit } from './fixtures/metricsTestKit';
import { testConfig } from './fixtures/httpTestKit';
import { createMcpHttpApp } from './http';
import { installMetrics } from './metrics';
import * as quickstartModule from './tools/registerQuickstartTool';
import { createAdspMcpServer } from './server';

interface RunningApp {
  httpServer: HttpServer;
  endpoint: URL;
}

async function listen(app: Express): Promise<RunningApp> {
  const httpServer = await new Promise<HttpServer>((resolveListening) => {
    const server = app.listen(0, '127.0.0.1', () => resolveListening(server));
  });
  const { port } = httpServer.address() as AddressInfo;
  return { httpServer, endpoint: new URL(`http://127.0.0.1:${port}/mcp`) };
}

async function stop({ httpServer }: RunningApp): Promise<void> {
  httpServer.closeAllConnections();
  await new Promise((resolveClosed) => httpServer.close(resolveClosed));
}

const INITIALIZE_REQUEST = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test-client', version: '0.0.1' } },
};

const TOOLS_LIST_REQUEST = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };

function postMcp(endpoint: URL, body: unknown, init: RequestInit = {}): Promise<Response> {
  return fetch(endpoint, {
    ...init,
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...init.headers },
    body: JSON.stringify(body),
  });
}

function postRawMcp(endpoint: URL, body: string): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body,
  });
}

async function waitFor(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`condition not met within ${timeoutMs} ms`);
    await new Promise((resolveTick) => setTimeout(resolveTick, 10));
  }
}

async function connectHttpClient(endpoint: URL): Promise<{ client: Client; transport: StreamableHTTPClientTransport }> {
  const client = new Client({ name: 'test-client', version: '0.0.1' });
  const transport = new StreamableHTTPClientTransport(endpoint);
  await client.connect(transport);
  return { client, transport };
}

describe('HTTP transport', () => {
  let running: RunningApp;
  let client: Client;
  let inMemoryClient: Client;

  beforeAll(async () => {
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT }));
    ({ client } = await connectHttpClient(running.endpoint));
    inMemoryClient = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterAll(async () => {
    await client.close();
    await inMemoryClient.close();
    await stop(running);
  });

  it.each(TOOL_CONTRACT.calls)('tools/call $call.name $call.arguments over HTTP matches the golden', async ({ call, outcome }) => {
    const actual = await callForContract(client, call);

    expect(actual).toEqual(outcome);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(outcome));
  });

  it('tools/list over HTTP equals the in-memory output', async () => {
    const [overHttp, inMemory] = await Promise.all([client.listTools(), inMemoryClient.listTools()]);

    expect(JSON.stringify(overHttp)).toBe(JSON.stringify(inMemory));
  });

  it.each(TRANSPORT_EQUIVALENCE_CALLS)('tools/call $name $arguments over HTTP equals the in-memory output', async (call) => {
    const [overHttp, inMemory] = await Promise.all([callForContract(client, call), callForContract(inMemoryClient, call)]);

    expect(JSON.stringify(overHttp)).toBe(JSON.stringify(inMemory));
  });

  it('serves a second session after the first closes', async () => {
    const first = await connectHttpClient(running.endpoint);
    await first.transport.terminateSession();
    await first.client.close();

    const second = await connectHttpClient(running.endpoint);
    const result = await second.client.callTool({ name: 'get_platform_quickstart', arguments: {} });
    await second.client.close();

    expect(result.isError).toBeUndefined();
  });
});

describe('HTTP startup', () => {
  let docsRoot: string;
  let readFileSyncSpy: jest.SpyInstance;
  let running: RunningApp | undefined;

  function countDocsReads(): number {
    return readFileSyncSpy.mock.calls.filter(([path]) => resolve(String(path)).startsWith(docsRoot)).length;
  }

  beforeEach(() => {
    docsRoot = mkdtempSync(join(tmpdir(), 'adsp-http-docs-'));
    mkdirSync(join(docsRoot, 'services'));
    writeFileSync(join(docsRoot, 'services', 'event-service.md'), '---\ntitle: Event service\n---\n\nRoutes events.');
    writeFileSync(join(docsRoot, 'services', 'file-service.md'), '---\ntitle: File service\n---\n\nStores files.');
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
  });

  afterEach(async () => {
    readFileSyncSpy.mockRestore();
    if (running) await stop(running);
    rmSync(docsRoot, { recursive: true, force: true });
  });

  it('builds the docs index before the first request', async () => {
    const app = createMcpHttpApp({ docsRoot });
    const readsBeforeListening = countDocsReads();
    running = await listen(app);
    const { client } = await connectHttpClient(running.endpoint);
    await client.callTool({ name: 'read_adsp_doc', arguments: { path: 'services/event-service.md' } });
    await client.close();

    expect([readsBeforeListening, countDocsReads()]).toEqual([2, 2]);
  });
});

describe('HTTP CORS', () => {
  const ALLOWED_ORIGIN = 'http://allowed.test';
  let running: RunningApp;

  beforeEach(async () => {
    running = await listen(
      createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: testConfig({ corsOrigins: [ALLOWED_ORIGIN] }) })
    );
  });

  afterEach(() => stop(running));

  it('answers a CORS preflight with 204', async () => {
    const response = await fetch(running.endpoint, { method: 'OPTIONS', headers: { origin: ALLOWED_ORIGIN } });

    expect(response.status).toBe(204);
  });

  it('allows the mcp-protocol-version request header', async () => {
    const response = await fetch(running.endpoint, { method: 'OPTIONS', headers: { origin: ALLOWED_ORIGIN } });

    expect(response.headers.get('access-control-allow-headers')?.split(', ')).toContain('mcp-protocol-version');
  });
});

describe('stateless HTTP', () => {
  let running: RunningApp;

  beforeEach(async () => {
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await stop(running);
  });

  it('sends no Mcp-Session-Id header on initialize', async () => {
    const response = await postMcp(running.endpoint, INITIALIZE_REQUEST);

    expect(response.headers.get('mcp-session-id')).toBeNull();
  });

  it('answers initialize with a JSON body', async () => {
    const response = await postMcp(running.endpoint, INITIALIZE_REQUEST);

    expect(response.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('answers tools/list without a prior initialize on this process', async () => {
    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST);
    const body = await response.json();

    expect({ status: response.status, toolCount: body.result?.tools.length }).toEqual({ status: 200, toolCount: 6 });
  });

  it('ignores an Mcp-Session-Id header from an earlier stateful session', async () => {
    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { headers: { 'mcp-session-id': randomUUID() } });

    expect(response.status).toBe(200);
  });

  it('closes the transport and server when the response closes', async () => {
    const transportClose = jest.spyOn(StreamableHTTPServerTransport.prototype, 'close');
    const serverClose = jest.spyOn(Server.prototype, 'close');

    await (await postMcp(running.endpoint, TOOLS_LIST_REQUEST)).text();
    await waitFor(() => transportClose.mock.calls.length > 0 && serverClose.mock.calls.length > 0);

    expect([transportClose, serverClose]).toEqual([expect.anything(), expect.anything()]);
  });

  it('closes the transport and server when the client disconnects mid-request', async () => {
    const handleRequest = jest
      .spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest')
      .mockImplementationOnce(() => new Promise(() => undefined));
    const transportClose = jest.spyOn(StreamableHTTPServerTransport.prototype, 'close');
    const serverClose = jest.spyOn(Server.prototype, 'close');
    const abort = new AbortController();

    const pending = postMcp(running.endpoint, TOOLS_LIST_REQUEST, { signal: abort.signal }).catch(() => undefined);
    await waitFor(() => handleRequest.mock.calls.length > 0);
    abort.abort();
    await pending;

    await expect(waitFor(() => transportClose.mock.calls.length > 0 && serverClose.mock.calls.length > 0)).resolves.toBeUndefined();
  });
});

describe('HTTP methods other than POST', () => {
  let running: RunningApp;

  beforeAll(async () => {
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterAll(() => stop(running));

  it.each(['GET', 'DELETE'])('%s /mcp returns 405 with Allow: POST and a JSON-RPC error', async (method) => {
    const response = await fetch(running.endpoint, { method });

    expect({ status: response.status, allow: response.headers.get('allow'), body: await response.json() }).toEqual({
      status: 405,
      allow: 'POST',
      body: { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null },
    });
  });
});

describe('HTTP request failures', () => {
  const INTERNAL_ERROR_BODY = { jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null };
  let running: RunningApp;
  let unhandledRejection: jest.Mock;

  beforeEach(async () => {
    unhandledRejection = jest.fn();
    process.on('unhandledRejection', unhandledRejection);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterEach(async () => {
    await new Promise((resolveTick) => setImmediate(resolveTick));
    process.off('unhandledRejection', unhandledRejection);
    jest.restoreAllMocks();
    await stop(running);

    expect(unhandledRejection).not.toHaveBeenCalled();
  });

  it('returns a JSON-RPC 500 when handling the request throws', async () => {
    jest.spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest').mockRejectedValueOnce(new Error('boom'));

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { signal: AbortSignal.timeout(2000) });

    expect({ status: response.status, body: await response.json() }).toEqual({ status: 500, body: INTERNAL_ERROR_BODY });
  });

  it('keeps serving after a request fails', async () => {
    jest.spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest').mockRejectedValueOnce(new Error('boom'));
    await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { signal: AbortSignal.timeout(2000) }).catch(() => undefined);

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { signal: AbortSignal.timeout(2000) });

    expect(response.status).toBe(200);
  });

  it('does not write an error body once headers are sent', async () => {
    jest.spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest').mockImplementationOnce(async (_req, res) => {
      (res as unknown as { writeHead(status: number): void }).writeHead(200);
      throw new Error('failed after headers');
    });

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { signal: AbortSignal.timeout(2000) });

    expect({ status: response.status, body: await response.text() }).toEqual({ status: 200, body: '' });
  });

  it('answers a malformed JSON body with a JSON-RPC parse error', async () => {
    const response = await postRawMcp(running.endpoint, '{not json');

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 400,
      body: { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error: Invalid JSON' }, id: null },
    });
  });

  it('answers a body over 1 MiB with a JSON-RPC payload-too-large error', async () => {
    const response = await postRawMcp(running.endpoint, JSON.stringify({ padding: 'a'.repeat(1024 * 1024) }));

    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 413,
      body: {
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Payload Too Large: Request body must not exceed 1048576 bytes' },
        id: null,
      },
    });
  });

  it('sends CORS headers when it rejects a request body from an allowed Origin', async () => {
    const allowedOrigin = 'http://allowed.test';
    const allowingApp = await listen(
      createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: testConfig({ corsOrigins: [allowedOrigin] }) })
    );
    try {
      const response = await fetch(allowingApp.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', origin: allowedOrigin },
        body: '{not json',
      });

      expect(response.status).toBe(400);
      expect(response.headers.get('access-control-allow-origin')).toBe(allowedOrigin);
    } finally {
      await stop(allowingApp);
    }
  });

  it('answers a malformed JSON body without crashing', async () => {
    const malformed = await fetch(running.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: '{not json',
    });
    const followUp = await postMcp(running.endpoint, TOOLS_LIST_REQUEST);

    expect([malformed.status, followUp.status]).toEqual([400, 200]);
  });
});

describe('HTTP tool handler failures', () => {
  let docsRoot: string;
  let running: RunningApp;
  let unhandledRejection: jest.Mock;

  beforeEach(async () => {
    unhandledRejection = jest.fn();
    process.on('unhandledRejection', unhandledRejection);
    docsRoot = mkdtempSync(join(tmpdir(), 'adsp-failing-tool-'));
    mkdirSync(join(docsRoot, 'services'));
    writeFileSync(join(docsRoot, 'services', 'event-service.md'), '---\ntitle: Event service\n---\n\nRoutes events.');
    jest.spyOn(quickstartModule, 'createQuickstartTool').mockReturnValue([
      {
        name: 'get_platform_quickstart',
        description: 'Quickstart that fails.',
        inputSchema: { type: 'object' },
        handler: () => {
          throw new Error('handler failed');
        },
      },
    ]);
    running = await listen(createMcpHttpApp({ docsRoot }));
  });

  afterEach(async () => {
    await new Promise((resolveTick) => setImmediate(resolveTick));
    process.off('unhandledRejection', unhandledRejection);
    jest.restoreAllMocks();
    await stop(running);
    rmSync(docsRoot, { recursive: true, force: true });

    expect(unhandledRejection).not.toHaveBeenCalled();
  });

  it('returns a JSON-RPC error when a tool handler throws', async () => {
    const { client } = await connectHttpClient(running.endpoint);

    const failure = await callForContract(client, { name: 'get_platform_quickstart', arguments: {} });
    await client.close();

    expect(failure).toEqual({ error: { code: -32603, message: 'MCP error -32603: handler failed' } });
  });

  it('keeps serving tool calls after a tool handler throws', async () => {
    const { client } = await connectHttpClient(running.endpoint);
    await callForContract(client, { name: 'get_platform_quickstart', arguments: {} });

    const result = await client.callTool({ name: 'search_adsp_docs', arguments: { query: 'event' } });
    await client.close();

    expect(result.isError).toBeUndefined();
  });
});

describe('stateless HTTP startup', () => {
  it('does not schedule an idle-session sweep', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    // The rate limiter's store resets its window on an unref'd interval, which isn't a session sweep.
    createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: testConfig({ rateLimitPerMinute: 0 }) });

    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });
});

describe('HTTP request metrics', () => {
  let kit: MetricsTestKit;
  let uninstall: () => void;
  let running: RunningApp;

  async function collectUntil(condition: () => boolean, timeoutMs = 2000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      await kit.collect();
      if (condition()) return;
      if (Date.now() > deadline) throw new Error(`metrics condition not met within ${timeoutMs} ms`);
      await new Promise((resolveTick) => setTimeout(resolveTick, 10));
    }
  }

  function requestCounts(): Record<string, number> {
    return Object.fromEntries(
      kit
        .points('mcp.request.duration')
        .map((point) => [
          `${point.attributes['mcp.method.name']} ${point.attributes['http.response.status_code']}`,
          histogramCount(point),
        ])
    );
  }

  function inFlight(): unknown {
    return kit.points('mcp.requests.in_flight')[0]?.value;
  }

  beforeEach(async () => {
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await stop(running);
    uninstall();
    await kit.shutdown();
  });

  it('records request duration by MCP method', async () => {
    await (await postMcp(running.endpoint, INITIALIZE_REQUEST)).text();
    await (await postMcp(running.endpoint, TOOLS_LIST_REQUEST)).text();

    await collectUntil(() => Object.keys(requestCounts()).length === 2);
    expect(requestCounts()).toEqual({ 'initialize 200': 1, 'tools/list 200': 1 });
  });

  it('records unparsed for a malformed body', async () => {
    await (await postRawMcp(running.endpoint, '{bad')).text();

    await collectUntil(() => Object.keys(requestCounts()).length === 1);
    expect(requestCounts()).toEqual({ 'unparsed 400': 1 });
  });

  it('labels a batch body as batch', async () => {
    await (await postMcp(running.endpoint, [TOOLS_LIST_REQUEST, { ...TOOLS_LIST_REQUEST, id: 3 }])).text();

    await collectUntil(() => Object.keys(requestCounts()).length === 1);
    expect(Object.keys(requestCounts())).toEqual([expect.stringMatching(/^batch /)]);
  });

  it('records each request exactly once', async () => {
    for (let i = 0; i < 3; i++) {
      await (await postMcp(running.endpoint, TOOLS_LIST_REQUEST)).text();
    }

    await collectUntil(() => requestCounts()['tools/list 200'] === 3);
    await new Promise((resolveTick) => setTimeout(resolveTick, 50));
    await kit.collect();
    expect(requestCounts()).toEqual({ 'tools/list 200': 3 });
  });

  it('returns in-flight to zero after requests finish, including an aborted one', async () => {
    await (await postMcp(running.endpoint, TOOLS_LIST_REQUEST)).text();
    const handleRequest = jest
      .spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest')
      .mockImplementationOnce(() => new Promise(() => undefined));
    const abort = new AbortController();
    const pending = postMcp(running.endpoint, TOOLS_LIST_REQUEST, { signal: abort.signal }).catch(() => undefined);
    await waitFor(() => handleRequest.mock.calls.length > 0);
    await collectUntil(() => inFlight() === 1);

    abort.abort();
    await pending;

    await collectUntil(() => inFlight() === 0);
    expect(inFlight()).toBe(0);
  });

  it('records a client abort as aborted, not as a 200', async () => {
    const handleRequest = jest
      .spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest')
      .mockImplementationOnce(() => new Promise(() => undefined));
    const abort = new AbortController();
    const pending = postMcp(running.endpoint, TOOLS_LIST_REQUEST, { signal: abort.signal }).catch(() => undefined);
    await waitFor(() => handleRequest.mock.calls.length > 0);
    abort.abort();
    await pending;

    await collectUntil(() => kit.points('mcp.request.duration').length === 1);
    const [point] = kit.points('mcp.request.duration');
    expect(point.attributes).toEqual({ 'mcp.method.name': 'unparsed', 'error.type': 'aborted' });
    expect(histogramCount(point)).toBe(1);
  });
});
