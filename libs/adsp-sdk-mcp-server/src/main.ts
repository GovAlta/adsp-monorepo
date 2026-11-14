#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readConfig, readHostedConfig } from './config';
import { startMcpHttpServer } from './hosted';
import { createAdspMcpServer } from './server';
import { configureLiveToolLimit } from './tools/liveToolLimit';

type Transport = 'stdio' | 'http';

function resolveTransport(): Transport {
  const raw = process.env['MCP_TRANSPORT'] ?? 'stdio';
  if (raw === 'stdio' || raw === 'http') return raw;
  console.error(`[adsp-sdk-mcp-server] Unknown MCP_TRANSPORT="${raw}". Valid values: stdio, http. Defaulting to stdio.`);
  return 'stdio';
}

async function main(): Promise<void> {
  const transport = resolveTransport();
  const config = transport === 'http' ? readHostedConfig() : readConfig();
  console.error(`[adsp-sdk-mcp-server] transport=${transport}`);

  if (transport === 'http') {
    await startMcpHttpServer({ config });
  } else {
    configureLiveToolLimit({ maxConcurrent: config.liveToolMaxConcurrent, waitMs: config.inFlightWaitMs });
    const server = createAdspMcpServer();
    await server.connect(new StdioServerTransport());
  }
}

main().catch((err) => {
  console.error('Failed to start adsp-sdk-mcp-server:', err);
  process.exit(1);
});
