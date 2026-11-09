import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import * as fs from 'fs';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
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
import { createMcpHttpApp, McpHttpApp } from './http';
import { createAdspMcpServer } from './server';

const SESSION_TTL_MS = 30 * 60 * 1000;

interface RunningApp {
  mcpApp: McpHttpApp;
  httpServer: HttpServer;
  endpoint: URL;
}

async function listen(mcpApp: McpHttpApp): Promise<RunningApp> {
  const httpServer = await new Promise<HttpServer>((resolveListening) => {
    const server = mcpApp.app.listen(0, '127.0.0.1', () => resolveListening(server));
  });
  const { port } = httpServer.address() as AddressInfo;
  return { mcpApp, httpServer, endpoint: new URL(`http://127.0.0.1:${port}/mcp`) };
}

async function stop({ mcpApp, httpServer }: RunningApp): Promise<void> {
  mcpApp.close();
  httpServer.closeAllConnections();
  await new Promise((resolveClosed) => httpServer.close(resolveClosed));
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
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, sessionTtlMs: SESSION_TTL_MS }));
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
    const mcpApp = createMcpHttpApp({ docsRoot, sessionTtlMs: SESSION_TTL_MS });
    const readsBeforeListening = countDocsReads();
    running = await listen(mcpApp);
    const { client } = await connectHttpClient(running.endpoint);
    await client.callTool({ name: 'read_adsp_doc', arguments: { path: 'services/event-service.md' } });
    await client.close();

    expect([readsBeforeListening, countDocsReads()]).toEqual([2, 2]);
  });
});

describe('HTTP sessions', () => {
  let running: RunningApp;
  let setIntervalSpy: jest.SpyInstance;

  beforeEach(async () => {
    setIntervalSpy = jest.spyOn(global, 'setInterval');
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, sessionTtlMs: -1 }));
  });

  afterEach(async () => {
    setIntervalSpy.mockRestore();
    await stop(running);
  });

  it('answers a CORS preflight with 204', async () => {
    const response = await fetch(running.endpoint, { method: 'OPTIONS' });

    expect(response.status).toBe(204);
  });

  it.each(['GET', 'DELETE'])('rejects %s /mcp without a known session with 400', async (method) => {
    const response = await fetch(running.endpoint, { method, headers: { 'mcp-session-id': 'unknown-session' } });

    expect(response.status).toBe(400);
  });

  it('reclaims a session idle longer than the TTL', async () => {
    const { client } = await connectHttpClient(running.endpoint);
    const runIdleSweep = setIntervalSpy.mock.calls[0][0] as () => void;

    runIdleSweep();

    await expect(client.listTools()).rejects.toThrow('Server not initialized');
    await client.close();
  });
});
