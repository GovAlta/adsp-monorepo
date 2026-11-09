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
import { createMcpHttpApp } from './http';
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
  let running: RunningApp;

  beforeEach(async () => {
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterEach(() => stop(running));

  it('answers a CORS preflight with 204', async () => {
    const response = await fetch(running.endpoint, { method: 'OPTIONS' });

    expect(response.status).toBe(204);
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

describe('stateless HTTP startup', () => {
  it('does not schedule an idle-session sweep', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT });

    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });
});
