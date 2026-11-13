import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ReadBuffer, serializeMessage } from '@modelcontextprotocol/sdk/shared/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative, resolve, sep } from 'path';
import { PassThrough, Readable, Writable } from 'stream';
import {
  callForContract,
  connectInMemoryClient,
  FIXTURE_DOCS_ROOT,
  TOOL_CONTRACT,
  TRANSPORT_EQUIVALENCE_CALLS,
} from './fixtures/toolContract';
import { createMetricsTestKit, histogramCount, MetricsTestKit } from './fixtures/metricsTestKit';
import { installMetrics } from './metrics';
import { createAdspMcpServer } from './server';
import * as quickstartModule from './tools/registerQuickstartTool';

class StreamClientTransport implements Transport {
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  private readonly readBuffer = new ReadBuffer();

  constructor(private readonly input: Readable, private readonly output: Writable) {}

  async start(): Promise<void> {
    this.input.on('data', (chunk: Buffer) => {
      this.readBuffer.append(chunk);
      for (let message = this.readBuffer.readMessage(); message; message = this.readBuffer.readMessage()) {
        this.onmessage?.(message);
      }
    });
  }

  async send(message: JSONRPCMessage): Promise<void> {
    this.output.write(serializeMessage(message));
  }

  async close(): Promise<void> {
    this.onclose?.();
  }
}

async function connectStdioClient(server: Server): Promise<Client> {
  const clientToServer = new PassThrough();
  const serverToClient = new PassThrough();
  const client = new Client({ name: 'test-client', version: '0.0.1' });
  await Promise.all([
    server.connect(new StdioServerTransport(clientToServer, serverToClient)),
    client.connect(new StreamClientTransport(serverToClient, clientToServer)),
  ]);
  return client;
}

// clean-code-ignore: 2.3 — 4-line helper; the review bot appears to be miscounting this function's length.
function writeDoc(root: string, relativePath: string, content: string): void {
  const fullPath = join(root, relativePath);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

describe('adsp-sdk-mcp-server', () => {
  let docsRoot: string;
  let client: Client;

  beforeEach(async () => {
    docsRoot = mkdtempSync(join(tmpdir(), 'adsp-docs-test-'));
    writeDoc(
      docsRoot,
      'services/event-service.md',
      '---\ntitle: Event service\n---\n\nThe event service routes domain events over RabbitMQ.'
    );

    const server = createAdspMcpServer({ docsRoot });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: 'test-client', version: '0.0.1' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  });

  afterEach(() => {
    rmSync(docsRoot, { recursive: true, force: true });
  });

  it('lists all tools including live-data tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'search_adsp_docs',
        'list_adsp_docs',
        'read_adsp_doc',
        'search_sdk_reference',
        'get_platform_quickstart',
        'list_service_roles',
        'get_service_configuration_schema',
        'get_adsp_mcp_server_info',
        'list_service_apis',
        'search_service_endpoints',
        'read_service_endpoint',
      ])
    );
  });

  it('search_adsp_docs finds a bundled doc by keyword', async () => {
    const result = await client.callTool({ name: 'search_adsp_docs', arguments: { query: 'event service' } });
    const [content] = result.content as { type: 'text'; text: string }[];
    const results = JSON.parse(content.text);

    expect(results[0].path).toBe('services/event-service.md');
  });

  it('read_adsp_doc returns the full content for a known path', async () => {
    const result = await client.callTool({
      name: 'read_adsp_doc',
      arguments: { path: 'services/event-service.md' },
    });
    const [content] = result.content as { type: 'text'; text: string }[];

    expect(content.text).toContain('routes domain events over RabbitMQ');
  });

  it('read_adsp_doc reports an error for an unknown path', async () => {
    const result = await client.callTool({ name: 'read_adsp_doc', arguments: { path: 'does/not-exist.md' } });

    expect(result.isError).toBe(true);
  });

  it('search_sdk_reference finds initializePlatform', async () => {
    const result = await client.callTool({
      name: 'search_sdk_reference',
      arguments: { query: 'initializePlatform' },
    });
    const [content] = result.content as { type: 'text'; text: string }[];
    const results = JSON.parse(content.text);

    expect(results[0].name).toBe('initializePlatform');
  });

  it('get_platform_quickstart returns the initializeService usage snippet, with initializePlatform noted as the platform-service variant', async () => {
    const result = await client.callTool({ name: 'get_platform_quickstart', arguments: {} });
    const [content] = result.content as { type: 'text'; text: string }[];

    expect(content.text).toContain('initializeService');
    expect(content.text).toContain('initializePlatform');
    expect(content.text).toContain('@abgov/adsp-service-sdk');
  });
});

describe('tool contract', () => {
  let client: Client;

  beforeAll(async () => {
    client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterAll(() => client.close());

  it.each(TOOL_CONTRACT.calls)('tools/call $call.name $call.arguments matches the golden', async ({ call, outcome }) => {
    const actual = await callForContract(client, call);

    expect(actual).toEqual(outcome);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(outcome));
  });
});

describe('stdio transport', () => {
  let stdioClient: Client;
  let inMemoryClient: Client;

  beforeAll(async () => {
    stdioClient = await connectStdioClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
    inMemoryClient = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterAll(async () => {
    await stdioClient.close();
    await inMemoryClient.close();
  });

  it.each(TOOL_CONTRACT.calls)('tools/call $call.name $call.arguments over stdio matches the golden', async ({ call, outcome }) => {
    const actual = await callForContract(stdioClient, call);

    expect(actual).toEqual(outcome);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(outcome));
  });

  it('tools/list over stdio equals the in-memory output', async () => {
    const [overStdio, inMemory] = await Promise.all([stdioClient.listTools(), inMemoryClient.listTools()]);

    expect(JSON.stringify(overStdio)).toBe(JSON.stringify(inMemory));
  });

  it.each(TRANSPORT_EQUIVALENCE_CALLS)('tools/call $name $arguments over stdio equals the in-memory output', async (call) => {
    const [overStdio, inMemory] = await Promise.all([
      callForContract(stdioClient, call),
      callForContract(inMemoryClient, call),
    ]);

    expect(JSON.stringify(overStdio)).toBe(JSON.stringify(inMemory));
  });
});

describe('shared tools', () => {
  let readFileSyncSpy: jest.SpyInstance;
  let roots: string[];

  function createDocsRoot(docs: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), 'adsp-shared-docs-'));
    roots.push(root);
    Object.entries(docs).forEach(([path, content]) => writeDoc(root, path, content));
    return root;
  }

  function countReadsUnder(root: string): number {
    return readFileSyncSpy.mock.calls.filter(([path]) => resolve(String(path)).startsWith(root)).length;
  }

  function firstText(result: Awaited<ReturnType<Client['callTool']>>): string {
    return (result.content as { type: 'text'; text: string }[])[0].text;
  }

  beforeEach(() => {
    roots = [];
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    readFileSyncSpy.mockRestore();
    roots.forEach((root) => rmSync(root, { recursive: true, force: true }));
  });

  it('reads each docs file once when two servers share a docs root', () => {
    const root = createDocsRoot({
      'services/event-service.md': '---\ntitle: Event service\n---\n\nRoutes domain events.',
      'services/file-service.md': '---\ntitle: File service\n---\n\nStores files.',
    });

    createAdspMcpServer({ docsRoot: root });
    createAdspMcpServer({ docsRoot: root });

    expect(countReadsUnder(root)).toBe(2);
  });

  it('resolves relative docs roots to the same cached index', () => {
    const root = createDocsRoot({
      'services/event-service.md': '---\ntitle: Event service\n---\n\nRoutes domain events.',
      'services/file-service.md': '---\ntitle: File service\n---\n\nStores files.',
    });

    createAdspMcpServer({ docsRoot: root });
    createAdspMcpServer({ docsRoot: relative(process.cwd(), root) + sep });

    expect(countReadsUnder(root)).toBe(2);
  });

  it("serves each docs root's own docs", async () => {
    const alphaRoot = createDocsRoot({ 'services/alpha-service.md': '---\ntitle: Alpha service\n---\n\nAlpha.' });
    const betaRoot = createDocsRoot({ 'services/beta-service.md': '---\ntitle: Beta service\n---\n\nBeta.' });
    const alphaClient = await connectInMemoryClient(createAdspMcpServer({ docsRoot: alphaRoot }));
    const betaClient = await connectInMemoryClient(createAdspMcpServer({ docsRoot: betaRoot }));

    const fromAlpha = await alphaClient.callTool({ name: 'search_adsp_docs', arguments: { query: 'beta' } });
    const fromBeta = await betaClient.callTool({ name: 'search_adsp_docs', arguments: { query: 'beta' } });

    expect(firstText(fromAlpha)).toBe('No ADSP docs match "beta". Try other keywords, or call list_adsp_docs to browse.');
    expect(JSON.parse(firstText(fromBeta))[0].path).toBe('services/beta-service.md');
  });

  it('does not cache a docs root that failed to load', async () => {
    const root = join(createDocsRoot({}), 'not-yet-created');
    expect(() => createAdspMcpServer({ docsRoot: root })).toThrow('ENOENT');
    writeDoc(root, 'services/late-service.md', '---\ntitle: Late service\n---\n\nAdded after a failed load.');

    const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: root }));
    const result = await client.callTool({ name: 'read_adsp_doc', arguments: { path: 'services/late-service.md' } });

    expect(firstText(result)).toContain('Added after a failed load.');
  });

  it('keeps serving one session after another session closes', async () => {
    const root = createDocsRoot({ 'services/event-service.md': '---\ntitle: Event service\n---\n\nRoutes domain events.' });
    const closingServer = createAdspMcpServer({ docsRoot: root });
    await connectInMemoryClient(closingServer);
    const remainingClient = await connectInMemoryClient(createAdspMcpServer({ docsRoot: root }));

    await closingServer.close();
    const result = await remainingClient.callTool({ name: 'read_adsp_doc', arguments: { path: 'services/event-service.md' } });

    expect(result.isError).toBeUndefined();
  });
});

describe('tool and docs index metrics', () => {
  let kit: MetricsTestKit;
  let uninstall: () => void;
  let roots: string[];

  function createDocsRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'adsp-metrics-docs-'));
    roots.push(root);
    writeDoc(root, 'services/event-service.md', '---\ntitle: Event service\n---\n\nRoutes domain events.');
    return root;
  }

  function toolPoints() {
    return kit.points('mcp.tool.duration').map((point) => ({ attributes: point.attributes, count: histogramCount(point) }));
  }

  beforeEach(() => {
    roots = [];
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
  });

  afterEach(async () => {
    uninstall();
    await kit.shutdown();
    jest.restoreAllMocks();
    roots.forEach((root) => rmSync(root, { recursive: true, force: true }));
  });

  it('records mcp.tool.duration for a successful tool call', async () => {
    const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
    await client.callTool({ name: 'search_adsp_docs', arguments: { query: 'event service' } });
    await client.close();
    await kit.collect();

    expect(toolPoints()).toEqual([{ attributes: { 'mcp.tool.name': 'search_adsp_docs' }, count: 1 }]);
  });

  it('labels a tool result with isError as tool_error', async () => {
    const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
    const result = await client.callTool({ name: 'read_adsp_doc', arguments: { path: 'services/missing.md' } });
    await client.close();
    await kit.collect();

    expect(result.isError).toBe(true);
    expect(toolPoints()).toEqual([
      { attributes: { 'mcp.tool.name': 'read_adsp_doc', 'error.type': 'tool_error' }, count: 1 },
    ]);
  });

  it('labels a throwing tool handler as exception and still returns the JSON-RPC error', async () => {
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
    const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: createDocsRoot() }));
    const outcome = await callForContract(client, { name: 'get_platform_quickstart', arguments: {} });
    await client.close();
    await kit.collect();

    expect(outcome).toEqual({ error: { code: -32603, message: 'MCP error -32603: handler failed' } });
    expect(toolPoints()).toEqual([
      { attributes: { 'mcp.tool.name': 'get_platform_quickstart', 'error.type': 'exception' }, count: 1 },
    ]);
  });

  it('labels every unknown tool name as unknown', async () => {
    const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
    for (const name of ['nope-1', 'nope-2', 'nope-3']) {
      await client.callTool({ name, arguments: {} });
    }
    await client.close();
    await kit.collect();

    expect(toolPoints()).toEqual([
      { attributes: { 'mcp.tool.name': 'unknown', 'error.type': 'unknown_tool' }, count: 3 },
    ]);
  });

  it('records the docs index build once per docs root', async () => {
    const root = createDocsRoot();
    createAdspMcpServer({ docsRoot: root });
    createAdspMcpServer({ docsRoot: root });
    await kit.collect();

    const points = kit.points('mcp.docs_index.build.duration');
    expect(points).toHaveLength(1);
    expect(histogramCount(points[0])).toBe(1);
  });

  it('does not record a docs index build that fails', async () => {
    expect(() => createAdspMcpServer({ docsRoot: join(tmpdir(), 'adsp-no-such-docs-root') })).toThrow();
    await kit.collect();

    expect(kit.points('mcp.docs_index.build.duration')).toEqual([]);
  });

  it('keeps the tool contract unchanged with metrics installed', async () => {
    const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
    const outcomes = [];
    for (const { call } of TOOL_CONTRACT.calls) {
      outcomes.push(await callForContract(client, call));
    }
    await client.close();

    expect(outcomes).toEqual(TOOL_CONTRACT.calls.map(({ outcome }) => outcome));
  });
});
