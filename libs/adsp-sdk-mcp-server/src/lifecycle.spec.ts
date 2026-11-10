import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  endpointFor,
  postMcp,
  startTestAuth,
  stopTestAuth,
  testConfig,
  TOOLS_LIST_REQUEST,
  waitFor,
} from './fixtures/httpTestKit';
import { createMcpHttpApp, createMcpHttpServer } from './http';
import { createGracefulShutdown, createLifecycle, ServerLifecycle } from './lifecycle';
import * as quickstartModule from './tools/registerQuickstartTool';

const QUICKSTART_CALL = {
  jsonrpc: '2.0',
  id: 7,
  method: 'tools/call',
  params: { name: 'get_platform_quickstart', arguments: {} },
};

const pause = (ms: number) => new Promise((resolveTick) => setTimeout(resolveTick, ms));

beforeAll(startTestAuth);
afterAll(stopTestAuth);

describe('graceful shutdown', () => {
  let docsRoot: string;
  let lifecycle: ServerLifecycle;
  let httpServer: HttpServer;
  let base: string;
  let handlerCalls: number;
  let releaseHeld: () => void;
  let exit: jest.Mock;
  let unhandledRejection: jest.Mock;

  async function start() {
    const app = createMcpHttpApp({ docsRoot, lifecycle, config: testConfig({ rateLimitPerMinute: 0 }) });
    httpServer = createMcpHttpServer(app, { connectionsCheckingIntervalMs: 50 });
    await new Promise<void>((resolveListening) => httpServer.listen(0, '127.0.0.1', resolveListening));
    base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  }

  function callHeldTool(): Promise<number> {
    return postMcp(endpointFor(base), QUICKSTART_CALL).then(async (response) => {
      await response.text();
      return response.status;
    });
  }

  function shutdownWith(options: { delayMs: number; timeoutMs: number; flush?: () => Promise<void> }) {
    return createGracefulShutdown({ httpServer, lifecycle, exit, log: () => undefined, ...options });
  }

  beforeEach(async () => {
    unhandledRejection = jest.fn();
    process.on('unhandledRejection', unhandledRejection);
    exit = jest.fn();
    lifecycle = createLifecycle();
    handlerCalls = 0;
    const held = new Promise<void>((resolve) => (releaseHeld = resolve));
    docsRoot = mkdtempSync(join(tmpdir(), 'adsp-shutdown-'));
    mkdirSync(join(docsRoot, 'services'));
    writeFileSync(join(docsRoot, 'services', 'event-service.md'), '---\ntitle: Event service\n---\n\nRoutes events.');
    jest.spyOn(quickstartModule, 'createQuickstartTool').mockReturnValue([
      {
        name: 'get_platform_quickstart',
        description: 'Quickstart that waits for the test.',
        inputSchema: { type: 'object' },
        handler: async () => {
          handlerCalls += 1;
          await held;
          return { content: [{ type: 'text', text: 'done' }] };
        },
      },
    ]);
    await start();
  });

  afterEach(async () => {
    releaseHeld();
    process.off('unhandledRejection', unhandledRejection);
    jest.restoreAllMocks();
    httpServer.closeAllConnections();
    await new Promise((resolveClosed) => httpServer.close(() => resolveClosed(undefined)));
    rmSync(docsRoot, { recursive: true, force: true });

    expect(unhandledRejection).not.toHaveBeenCalled();
  });

  it('reports ready until shutdown begins, then 503 on /ready while /health stays 200', async () => {
    expect((await fetch(`${base}/ready`)).status).toBe(200);

    lifecycle.beginDrain();
    const ready = await fetch(`${base}/ready`);

    expect(ready.status).toBe(503);
    expect(await ready.json()).toEqual({ status: 'draining' });
    expect((await fetch(`${base}/health`)).status).toBe(200);
  });

  it('asks clients to close the connection while draining', async () => {
    lifecycle.beginDrain();

    const response = await postMcp(endpointFor(base), TOOLS_LIST_REQUEST);
    await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('connection')).toBe('close');
  });

  it('asks the client to close the connection on a request that was already running when draining began', async () => {
    const held = postMcp(endpointFor(base), QUICKSTART_CALL);
    await waitFor(() => handlerCalls === 1);

    lifecycle.beginDrain();
    releaseHeld();
    const response = await held;
    await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('connection')).toBe('close');
  });

  it('keeps serving during the delay, lets in-flight requests finish, then exits 0 after flushing', async () => {
    const order: string[] = [];
    const flush = jest.fn(async () => {
      order.push('flush');
    });
    exit.mockImplementation((code: number) => order.push(`exit ${code}`));
    const held = callHeldTool();
    await waitFor(() => handlerCalls === 1);

    shutdownWith({ delayMs: 500, timeoutMs: 5000, flush })();
    const duringDelay = await postMcp(endpointFor(base), TOOLS_LIST_REQUEST);
    await duringDelay.text();
    await pause(600);
    releaseHeld();

    expect(duringDelay.status).toBe(200);
    expect(await held).toBe(200);
    await waitFor(() => exit.mock.calls.length > 0);
    expect(order).toEqual(['flush', 'exit 0']);
  });

  it('stops accepting new connections once the delay has passed', async () => {
    const held = callHeldTool();
    await waitFor(() => handlerCalls === 1);

    shutdownWith({ delayMs: 20, timeoutMs: 5000 })();
    await pause(100);
    const refused = await postMcp(endpointFor(base), TOOLS_LIST_REQUEST).then(
      () => 'accepted',
      () => 'refused'
    );
    releaseHeld();

    expect(refused).toBe('refused');
    expect(await held).toBe(200);
  });

  it('exits 1 at the deadline when a request never finishes', async () => {
    void callHeldTool().catch(() => undefined);
    await waitFor(() => handlerCalls === 1);

    shutdownWith({ delayMs: 10, timeoutMs: 200 })();
    await waitFor(() => exit.mock.calls.length > 0, 2000);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('exits 0 even when the metrics flush fails', async () => {
    shutdownWith({ delayMs: 10, timeoutMs: 2000, flush: () => Promise.reject(new Error('collector down')) })();

    await waitFor(() => exit.mock.calls.length > 0);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('ignores a second signal', async () => {
    const closeSpy = jest.spyOn(httpServer, 'close');
    const shutdown = shutdownWith({ delayMs: 10, timeoutMs: 2000 });

    shutdown();
    shutdown();
    await waitFor(() => exit.mock.calls.length > 0);
    await pause(50);

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});
