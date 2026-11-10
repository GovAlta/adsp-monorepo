import { EventEmitter } from 'events';
import { postMcp, testConfig, waitFor } from './fixtures/httpTestKit';
import { FIXTURE_DOCS_ROOT } from './fixtures/toolContract';
import { startMcpHttpServer, StartedMcpHttpServer } from './hosted';

const SEARCH_CALL = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { name: 'search_adsp_docs', arguments: { query: 'event service' } },
};

describe('startMcpHttpServer', () => {
  let started: StartedMcpHttpServer | undefined;
  let signals: EventEmitter;
  let exit: jest.Mock;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    signals = new EventEmitter();
    exit = jest.fn();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    if (started) {
      started.httpServer.closeAllConnections();
      await new Promise((resolveClosed) => started?.httpServer.close(() => resolveClosed(undefined)));
      started = undefined;
    }
    consoleError.mockRestore();
  });

  async function start(overrides: Partial<Parameters<typeof startMcpHttpServer>[0]> = {}) {
    started = await startMcpHttpServer({
      docsRoot: FIXTURE_DOCS_ROOT,
      port: 0,
      host: '127.0.0.1',
      env: {},
      config: testConfig({ rateLimitPerMinute: 0, shutdownDelayMs: 300, shutdownTimeoutMs: 3000 }),
      signals,
      exit,
      ...overrides,
    });
    return `http://127.0.0.1:${started.port}`;
  }

  it('serves the MCP endpoint from the given docs root and reports ready', async () => {
    const base = await start();

    const response = await postMcp(new URL(`${base}/mcp`), SEARCH_CALL);
    const body = await response.json();

    expect((await fetch(`${base}/ready`)).status).toBe(200);
    expect(response.status).toBe(200);
    expect(body.result.content[0].text).toContain('services/event-service.md');
  });

  it('drains and exits 0 on SIGTERM', async () => {
    const base = await start();

    signals.emit('SIGTERM');

    expect((await fetch(`${base}/ready`)).status).toBe(503);
    await waitFor(() => exit.mock.calls.length > 0);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('also drains on SIGINT', async () => {
    await start();

    signals.emit('SIGINT');

    await waitFor(() => exit.mock.calls.length > 0);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('reads the port from PORT when none is given', async () => {
    const base = await start({ port: undefined, env: { PORT: '0' } });

    expect((await fetch(`${base}/health`)).status).toBe(200);
  });
});
