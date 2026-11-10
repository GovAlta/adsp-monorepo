#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpHttpApp } from './http';
import { createAdspMcpServer } from './server';

type Transport = 'stdio' | 'http';

function resolveTransport(): Transport {
  const raw = process.env['MCP_TRANSPORT'] ?? 'stdio';
  if (raw === 'stdio' || raw === 'http') return raw;
  console.error(`[adsp-sdk-mcp-server] Unknown MCP_TRANSPORT="${raw}". Valid values: stdio, http. Defaulting to stdio.`);
  return 'stdio';
}

async function main(): Promise<void> {
  const transport = resolveTransport();
  console.error(`[adsp-sdk-mcp-server] transport=${transport}`);

  if (transport === 'http') {
    await startHttp();
  } else {
    const server = createAdspMcpServer();
    await server.connect(new StdioServerTransport());
  }
}

async function startHttp(): Promise<void> {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  const app = createMcpHttpApp();

  return new Promise((resolve) => {
    const httpServer = app.listen(port, () => {
      console.error(`[adsp-sdk-mcp-server] HTTP server listening on :${port}`);
      resolve();
    });

    function shutdown() {
      httpServer.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 5_000).unref();
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  });
}

main().catch((err) => {
  console.error('Failed to start adsp-sdk-mcp-server:', err);
  process.exit(1);
});
