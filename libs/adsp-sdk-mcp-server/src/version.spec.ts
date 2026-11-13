import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createAdspMcpServer } from './server';
import { FIXTURE_DOCS_ROOT } from './fixtures/toolContract';

const packageVersion: string = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')).version;

describe('server version', () => {
  it('advertises the version in package.json to MCP clients', async () => {
    const server = createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT });
    const client = new Client({ name: 'test-client', version: '0.0.1' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    expect(client.getServerVersion()).toEqual({ name: 'adsp-sdk-mcp-server', version: packageVersion });
    await client.close();
  });
});
