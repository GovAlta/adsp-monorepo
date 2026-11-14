import type { Express } from 'express';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { McpServerConfig, readConfig } from '../config';
import { AuthTestKit, createAuthTestKit } from './authTestKit';

export const TEST_REALM = 'test-realm';

export interface RunningApp {
  httpServer: HttpServer;
  endpoint: URL;
  health: URL;
}

let auth: AuthTestKit | undefined;

/** Starts the local signing-key server that testConfig() and postMcp() use; call from beforeAll. */
export async function startTestAuth(): Promise<void> {
  auth = await createAuthTestKit();
}

export async function stopTestAuth(): Promise<void> {
  await auth?.close();
  auth = undefined;
}

export function testAuth(): AuthTestKit {
  if (!auth) {
    throw new Error('Call startTestAuth() in beforeAll before using signed-in test helpers.');
  }
  return auth;
}

export function authHeaders(realm = TEST_REALM): Record<string, string> {
  return { authorization: `Bearer ${testAuth().sign(realm)}` };
}

export function endpointFor(base: string | URL, realm = TEST_REALM): URL {
  return new URL(`/mcp/${realm}`, base);
}

export async function listen(app: Express): Promise<RunningApp> {
  const httpServer = await new Promise<HttpServer>((resolveListening) => {
    const server = app.listen(0, '127.0.0.1', () => resolveListening(server));
  });
  const { port } = httpServer.address() as AddressInfo;
  return {
    httpServer,
    endpoint: endpointFor(`http://127.0.0.1:${port}`),
    health: new URL(`http://127.0.0.1:${port}/health`),
  };
}

export async function stop({ httpServer }: RunningApp): Promise<void> {
  httpServer.closeAllConnections();
  await new Promise((resolveClosed) => httpServer.close(resolveClosed));
}

export function testConfig(overrides: Partial<McpServerConfig> = {}): McpServerConfig {
  return { ...readConfig({}), auth: testAuth().hostedAuth(), ...overrides };
}

export const TOOLS_LIST_REQUEST = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };

/** Signed in as TEST_REALM unless `headers` overrides authorization; an empty value sends no Authorization. */
export function postMcp(endpoint: URL, body: unknown, headers: Record<string, string> = {}, signal?: AbortSignal) {
  return postRawMcp(endpoint, JSON.stringify(body), headers, signal);
}

export function postRawMcp(endpoint: URL, body: string, headers: Record<string, string> = {}, signal?: AbortSignal) {
  const merged: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    ...authHeaders(),
    ...headers,
  };
  return fetch(endpoint, {
    method: 'POST',
    headers: Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== '')),
    body,
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
