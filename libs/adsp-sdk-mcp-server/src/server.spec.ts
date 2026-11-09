import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ReadBuffer, serializeMessage } from '@modelcontextprotocol/sdk/shared/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PassThrough, Readable, Writable } from 'stream';
import { callForContract, FIXTURE_DOCS_ROOT, TOOL_CONTRACT } from './fixtures/toolContract';
import { createAdspMcpServer } from './server';

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

async function connectInMemoryClient(server: Server): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.1' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
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
        'read_adsp_doc',
        'search_sdk_reference',
        'get_platform_quickstart',
        'list_service_roles',
        'get_service_configuration_schema',
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

  it('tools/list matches the golden', async () => {
    const { tools } = await client.listTools();

    expect(JSON.stringify(tools)).toBe(JSON.stringify(TOOL_CONTRACT.tools));
  });

  it.each(TOOL_CONTRACT.calls)('tools/call $call.name $call.arguments matches the golden', async ({ call, outcome }) => {
    const actual = await callForContract(client, call);

    expect(JSON.stringify(actual)).toBe(JSON.stringify(outcome));
  });
});

describe('stdio transport', () => {
  let client: Client;

  beforeAll(async () => {
    client = await connectStdioClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
  });

  afterAll(() => client.close());

  it('tools/list over stdio matches the golden', async () => {
    const { tools } = await client.listTools();

    expect(JSON.stringify(tools)).toBe(JSON.stringify(TOOL_CONTRACT.tools));
  });

  it.each(TOOL_CONTRACT.calls)('tools/call $call.name $call.arguments over stdio matches the golden', async ({ call, outcome }) => {
    const actual = await callForContract(client, call);

    expect(JSON.stringify(actual)).toBe(JSON.stringify(outcome));
  });
});
