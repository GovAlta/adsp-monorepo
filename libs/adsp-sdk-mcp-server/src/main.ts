#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createAdspMcpServer } from './server';

async function main(): Promise<void> {
  const server = createAdspMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start adsp-sdk-mcp-server:', err);
  process.exit(1);
});
