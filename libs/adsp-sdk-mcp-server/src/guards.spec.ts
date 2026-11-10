import { McpServerConfig } from './config';
import { FIXTURE_DOCS_ROOT } from './fixtures/toolContract';
import {
  JSON_RPC_ERROR,
  listen,
  postMcp,
  RunningApp,
  stop,
  testConfig,
  TOOLS_LIST_REQUEST,
} from './fixtures/httpTestKit';
import { createMetricsTestKit, MetricsTestKit } from './fixtures/metricsTestKit';
import { createMcpHttpApp } from './http';
import { installMetrics } from './metrics';

const ALLOWED = 'http://allowed.test';

describe('Origin check', () => {
  let running: RunningApp;
  let kit: MetricsTestKit;
  let uninstall: () => void;

  async function start(config: Partial<McpServerConfig> = {}) {
    running = await listen(
      createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: testConfig({ corsOrigins: [ALLOWED], ...config }) })
    );
  }

  beforeEach(() => {
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
  });

  afterEach(async () => {
    await stop(running);
    uninstall();
    await kit.shutdown();
  });

  it('rejects a disallowed Origin with 403 and a JSON-RPC body', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'http://evil.test' });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(JSON_RPC_ERROR('Origin not allowed'));
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('rejects Origin: null', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'null' });

    expect(response.status).toBe(403);
  });

  it('allows a listed Origin and echoes it', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: ALLOWED });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED);
    expect(response.headers.get('vary')).toMatch(/Origin/i);
  });

  it('allows a request with no Origin and sends no Allow-Origin', async () => {
    await start();

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST);

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('rejects every Origin when no origins are configured', async () => {
    await start({ corsOrigins: [] });

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: ALLOWED });

    expect(response.status).toBe(403);
  });

  it('answers a preflight from an allowed Origin with 204 and the CORS headers', async () => {
    await start();

    const response = await fetch(running.endpoint, { method: 'OPTIONS', headers: { origin: ALLOWED } });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED);
    expect(response.headers.get('access-control-allow-headers')?.split(', ')).toContain('mcp-protocol-version');
  });

  it('answers a preflight from a disallowed Origin with 403', async () => {
    await start();

    const response = await fetch(running.endpoint, { method: 'OPTIONS', headers: { origin: 'http://evil.test' } });

    expect(response.status).toBe(403);
  });

  it('allows any Origin when CORS_ORIGIN is *', async () => {
    await start({ corsOrigins: '*' });

    const response = await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'http://anything.test' });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('counts an origin rejection', async () => {
    await start();

    await (await postMcp(running.endpoint, TOOLS_LIST_REQUEST, { origin: 'http://evil.test' })).text();
    await kit.collect();

    expect(kit.points('mcp.requests.rejected').map((point) => [point.attributes['reason'], point.value])).toEqual([
      ['origin', 1],
    ]);
  });

  it('does not guard /health', async () => {
    await start();

    const response = await fetch(running.health, { headers: { origin: 'http://evil.test' } });

    expect(response.status).toBe(200);
  });
});
