import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpError } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ContractCall {
  call: { name: string; arguments: Record<string, unknown> };
  outcome: unknown;
}

export interface ToolContract {
  tools: unknown[];
  calls: ContractCall[];
}

export const FIXTURE_DOCS_ROOT = join(__dirname, 'docs');

export const TOOL_CONTRACT: ToolContract = JSON.parse(
  readFileSync(join(__dirname, 'tool-contract.golden.json'), 'utf8')
);

export async function callForContract(client: Client, call: ContractCall['call']): Promise<unknown> {
  try {
    return { result: await client.callTool(call) };
  } catch (err) {
    const { code, message } = err as McpError;
    return { error: { code, message } };
  }
}
