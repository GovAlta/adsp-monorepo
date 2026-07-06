import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createAdspMcpServer } from './server';

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

  it('lists all four tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);

    expect(names).toEqual(
      expect.arrayContaining(['search_adsp_docs', 'read_adsp_doc', 'search_sdk_reference', 'get_platform_quickstart'])
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

  it('get_platform_quickstart returns the initializePlatform usage snippet', async () => {
    const result = await client.callTool({ name: 'get_platform_quickstart', arguments: {} });
    const [content] = result.content as { type: 'text'; text: string }[];

    expect(content.text).toContain('initializePlatform');
    expect(content.text).toContain('@abgov/adsp-service-sdk');
  });
});
