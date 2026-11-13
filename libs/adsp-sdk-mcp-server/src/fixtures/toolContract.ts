import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { McpError } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ContractCall {
  call: ToolCall;
  outcome: unknown;
}

export interface ToolContract {
  calls: ContractCall[];
}

export const FIXTURE_DOCS_ROOT = join(__dirname, 'docs');

export const TOOL_CONTRACT: ToolContract = JSON.parse(
  readFileSync(join(__dirname, 'tool-contract.golden.json'), 'utf8')
);

// Not pinned in the golden: their output follows the SDK reference, quickstart text and zod, which change often.
export const TRANSPORT_EQUIVALENCE_CALLS: ToolCall[] = [
  { name: 'search_sdk_reference', arguments: { query: 'initializePlatform' } },
  { name: 'search_sdk_reference', arguments: { query: 'send event', limit: 3 } },
  { name: 'get_platform_quickstart', arguments: {} },
  { name: 'search_adsp_docs', arguments: { limit: 3 } },
  { name: 'get_adsp_mcp_server_info', arguments: {} },
];

export async function callForContract(client: Client, call: ToolCall): Promise<unknown> {
  try {
    return { result: await client.callTool(call) };
  } catch (err) {
    const { code, message } = err as McpError;
    return { error: { code, message } };
  }
}

export async function connectInMemoryClient(server: Server): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.1' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}
