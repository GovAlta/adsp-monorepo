#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServerConfig, readConfig } from './config';
import { createMcpHttpApp, createMcpHttpServer } from './http';
import { createGracefulShutdown, createLifecycle } from './lifecycle';
import { startMetricsFromEnv } from './metrics';
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
  const config = readConfig();
  console.error(`[adsp-sdk-mcp-server] transport=${transport}`);

  if (transport === 'http') {
    await startHttp(config);
  } else {
    configureLiveToolLimit({ maxConcurrent: config.liveToolMaxConcurrent, waitMs: config.inFlightWaitMs });
    const server = createAdspMcpServer();
    await server.connect(new StdioServerTransport());
  }
}

async function startHttp(config: McpServerConfig): Promise<void> {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  // Started before the app so the docs index build, which the app triggers, is recorded.
  const metrics = await startMetricsFromEnv();
  const lifecycle = createLifecycle();
  const app = createMcpHttpApp({ config, lifecycle });

  return new Promise((resolve) => {
    const httpServer = createMcpHttpServer(app).listen(port, () => {
      console.error(`[adsp-sdk-mcp-server] HTTP server listening on :${port}`);
      resolve();
    });

    const shutdown = createGracefulShutdown({
      httpServer,
      lifecycle,
      delayMs: config.shutdownDelayMs,
      timeoutMs: config.shutdownTimeoutMs,
      flush: () => metrics?.shutdown() ?? Promise.resolve(),
      exit: (code) => process.exit(code),
    });

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  });
}

main().catch((err) => {
  console.error('Failed to start adsp-sdk-mcp-server:', err);
  process.exit(1);
});
