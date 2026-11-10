import type { Express } from 'express';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { McpServerConfig, readConfig } from '../config';

export interface RunningApp {
  httpServer: HttpServer;
  endpoint: URL;
  health: URL;
}

export async function listen(app: Express): Promise<RunningApp> {
  const httpServer = await new Promise<HttpServer>((resolveListening) => {
    const server = app.listen(0, '127.0.0.1', () => resolveListening(server));
  });
  const { port } = httpServer.address() as AddressInfo;
  return {
    httpServer,
    endpoint: new URL(`http://127.0.0.1:${port}/mcp`),
    health: new URL(`http://127.0.0.1:${port}/health`),
  };
}

export async function stop({ httpServer }: RunningApp): Promise<void> {
  httpServer.closeAllConnections();
  await new Promise((resolveClosed) => httpServer.close(resolveClosed));
}

export function testConfig(overrides: Partial<McpServerConfig> = {}): McpServerConfig {
  return { ...readConfig({}), ...overrides };
}

export const TOOLS_LIST_REQUEST = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };

export function postMcp(endpoint: URL, body: unknown, headers: Record<string, string> = {}, signal?: AbortSignal) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
    body: JSON.stringify(body),
    signal,
  });
}

export async function waitFor(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`condition not met within ${timeoutMs} ms`);
    await new Promise((resolveTick) => setTimeout(resolveTick, 10));
  }
}

export const JSON_RPC_ERROR = (message: string) => ({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });
