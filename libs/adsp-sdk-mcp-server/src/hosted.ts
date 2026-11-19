import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { McpServerConfig, readHostedConfig } from './config';
import { createMcpHttpApp, createMcpHttpServer } from './http';
import { createGracefulShutdown, createLifecycle } from './lifecycle';
import { startMetricsFromEnv } from './metrics';
import type { CreateAdspMcpServerOptions } from './server';

export interface StartMcpHttpServerOptions extends CreateAdspMcpServerOptions {
  /** Defaults to `PORT`, then 3000. */
  port?: number;
  host?: string;
  env?: NodeJS.ProcessEnv;
  /** Defaults to `readHostedConfig(env)`. */
  config?: McpServerConfig;
  /** Where SIGTERM and SIGINT arrive; defaults to `process`. */
  signals?: NodeJS.EventEmitter;
  exit?: (code: number) => void;
}

export interface StartedMcpHttpServer {
  httpServer: HttpServer;
  port: number;
}

/** Runs the hosted HTTP server: metrics, the app, request deadlines, readiness and the graceful drain on signals. */
export async function startMcpHttpServer({
  port,
  host,
  env = process.env,
  config = readHostedConfig(env),
  signals = process,
  exit = (code) => process.exit(code),
  ...serverOptions
}: StartMcpHttpServerOptions = {}): Promise<StartedMcpHttpServer> {
  // Started before the app so the docs index build, which the app triggers, is recorded.
  const metrics = await startMetricsFromEnv(env);
  const lifecycle = createLifecycle();
  const app = createMcpHttpApp({ ...serverOptions, config, lifecycle });
  const httpServer = createMcpHttpServer(app);

  await new Promise<void>((resolveListening) =>
    httpServer.listen(port ?? parseInt(env['PORT'] ?? '3000', 10), host, resolveListening)
  );
  const listeningPort = (httpServer.address() as AddressInfo).port;
  console.error(`[adsp-sdk-mcp-server] HTTP server listening on :${listeningPort}`);

  const shutdown = createGracefulShutdown({
    httpServer,
    lifecycle,
    delayMs: config.shutdownDelayMs,
    timeoutMs: config.shutdownTimeoutMs,
    flush: () => metrics?.shutdown() ?? Promise.resolve(),
    exit,
  });
  signals.on('SIGTERM', shutdown);
  signals.on('SIGINT', shutdown);

  return { httpServer, port: listeningPort };
}
