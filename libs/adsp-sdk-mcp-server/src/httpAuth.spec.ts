import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpServerConfig, readConfig } from './config';
import {
  authHeaders,
  listen,
  postMcp,
  RunningApp,
  startTestAuth,
  stop,
  stopTestAuth,
  testAuth,
  testConfig,
  TEST_REALM,
  TOOLS_LIST_REQUEST,
} from './fixtures/httpTestKit';
import { FIXTURE_DOCS_ROOT, TOOL_CONTRACT } from './fixtures/toolContract';
import { callForContract } from './fixtures/toolContract';
import { createMcpHttpApp, createMcpHttpServer } from './http';
import { SERVER_INSTRUCTIONS } from './instructions';
import { AddressInfo, connect } from 'net';

const PUBLIC_URL = 'https://mcp.example.test';
const OFFLINE_TOOL_NAMES = [
  'find_adsp_services',
  'search_adsp_docs',
  'list_adsp_docs',
  'read_adsp_doc',
  'search_sdk_reference',
  'get_platform_quickstart',
  'get_adsp_mcp_server_info',
  'list_service_apis',
  'search_service_endpoints',
  'read_service_endpoint',
];
const INITIALIZE_REQUEST = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test-client', version: '0.0.1' } },
};
const ALLOWED = 'http://allowed.test';

beforeAll(startTestAuth);
afterAll(stopTestAuth);

describe('HTTP sign-in', () => {
  let running: RunningApp | undefined;

  async function start(overrides = {}) {
    running = await listen(
      createMcpHttpApp({
        docsRoot: FIXTURE_DOCS_ROOT,
        config: testConfig({ auth: testAuth().hostedAuth(PUBLIC_URL), corsOrigins: [ALLOWED], ...overrides }),
      })
    );
    return running;
  }

  afterEach(async () => {
    if (running) {
      await stop(running);
      running = undefined;
    }
  });

  it('answers a request without a token with 401 and the metadata URL', async () => {
    const { endpoint } = await start();

    const response = await postMcp(endpoint, TOOLS_LIST_REQUEST, { authorization: '' });

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe(
      `Bearer resource_metadata="${PUBLIC_URL}/.well-known/oauth-protected-resource/mcp/${TEST_REALM}"`
    );
  });

  it('serves a signed-in request', async () => {
    const { endpoint } = await start();

    const response = await postMcp(endpoint, TOOLS_LIST_REQUEST);

    expect(response.status).toBe(200);
    expect((await response.json()).result.tools).toHaveLength(12);
  });

  it('rejects a token for another realm', async () => {
    const { endpoint } = await start();

    const response = await postMcp(endpoint, TOOLS_LIST_REQUEST, authHeaders('another-realm'));

    expect(response.status).toBe(401);
  });

  it('serves the protected-resource metadata through the Origin guard', async () => {
    const { endpoint } = await start();
    const metadata = new URL(`/.well-known/oauth-protected-resource/mcp/${TEST_REALM}`, endpoint);

    const allowed = await fetch(metadata, { headers: { origin: ALLOWED } });
    const disallowed = await fetch(metadata, { headers: { origin: 'http://evil.test' } });

    expect(allowed.status).toBe(200);
    expect(allowed.headers.get('access-control-allow-origin')).toBe(ALLOWED);
    expect((await allowed.json()).authorization_servers).toEqual([testAuth().issuer(TEST_REALM)]);
    expect(disallowed.status).toBe(403);
  });

  it('lets browsers send Authorization and read WWW-Authenticate', async () => {
    const { endpoint } = await start();

    const preflight = await fetch(endpoint, { method: 'OPTIONS', headers: { origin: ALLOWED } });

    expect(preflight.headers.get('access-control-allow-headers')?.split(', ')).toContain('Authorization');
    expect(preflight.headers.get('access-control-expose-headers')?.split(', ')).toContain('WWW-Authenticate');
  });

  it('rate-limits clients before checking their token', async () => {
    const { endpoint } = await start({ rateLimitPerMinute: 1, trustedProxy: 'loopback' });
    const anonymous = { authorization: '', 'x-forwarded-for': '203.0.113.9' };

    await (await postMcp(endpoint, TOOLS_LIST_REQUEST, anonymous)).text();
    const limited = await postMcp(endpoint, TOOLS_LIST_REQUEST, anonymous);

    expect(limited.status).toBe(429);
  });

  it('keeps unauthenticated requests out of the in-flight slots', async () => {
    const { endpoint } = await start({ maxInFlight: 1, inFlightWaitMs: 0, rateLimitPerMinute: 0 });

    const anonymous = await Promise.all(
      Array.from({ length: 5 }, () => postMcp(endpoint, TOOLS_LIST_REQUEST, { authorization: '' }))
    );
    const signedIn = await postMcp(endpoint, TOOLS_LIST_REQUEST);

    expect(anonymous.map((response) => response.status)).toEqual([401, 401, 401, 401, 401]);
    expect(signedIn.status).toBe(200);
  });

  it('keeps the tool contract unchanged for a signed-in client', async () => {
    const { endpoint } = await start();
    const client = new Client({ name: 'test-client', version: '0.0.1' });
    await client.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: authHeaders() } }));

    const outcomes = [];
    for (const { call } of TOOL_CONTRACT.calls) {
      outcomes.push(await callForContract(client, call));
    }
    await client.close();

    expect(outcomes).toEqual(TOOL_CONTRACT.calls.map(({ outcome }) => outcome));
  });
});

describe('plain /mcp', () => {
  let running: RunningApp | undefined;

  async function start(overrides: Partial<McpServerConfig> = {}) {
    running = await listen(
      createMcpHttpApp({
        docsRoot: FIXTURE_DOCS_ROOT,
        config: testConfig({ auth: testAuth().hostedAuth(PUBLIC_URL), corsOrigins: [ALLOWED], ...overrides }),
      })
    );
    return { ...running, plain: new URL('/mcp', running.endpoint) };
  }

  afterEach(async () => {
    if (running) {
      await stop(running);
      running = undefined;
    }
  });

  async function listedToolNames(response: Response): Promise<string[]> {
    return (await response.json()).result.tools.map((tool: { name: string }) => tool.name);
  }

  it('lists only the offline tools to a client without a token', async () => {
    const { plain } = await start();

    const response = await postMcp(plain, TOOLS_LIST_REQUEST, { authorization: '' });

    expect(response.status).toBe(200);
    expect(await listedToolNames(response)).toEqual(OFFLINE_TOOL_NAMES);
  });

  it('still lists only the offline tools when a token is sent', async () => {
    const { plain } = await start();

    const response = await postMcp(plain, TOOLS_LIST_REQUEST);

    expect(await listedToolNames(response)).toEqual(OFFLINE_TOOL_NAMES);
  });

  it.each(['list_service_roles', 'get_service_configuration_schema'])(
    'refuses to call %s and says where it is served',
    async (name) => {
      const { plain } = await start();

      const response = await postMcp(
        plain,
        { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name, arguments: {} } },
        { authorization: '' }
      );

      const { result } = await response.json();
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toMatch(/sign in/i);
      expect(result.content[0].text).toContain('/mcp/<tenant realm>');
    }
  );

  it('tells the model where the live tools are instead of asking for a CLI login', async () => {
    const { plain, endpoint } = await start();

    const open = (await (await postMcp(plain, INITIALIZE_REQUEST, { authorization: '' })).json()).result;
    const signedIn = (await (await postMcp(endpoint, INITIALIZE_REQUEST)).json()).result;

    expect(open.instructions).not.toContain('adsp-cli login');
    expect(open.instructions).toContain('/mcp/<tenant realm>');
    expect(signedIn.instructions).toBe(SERVER_INSTRUCTIONS);
  });

  it('answers a CORS preflight', async () => {
    const { plain } = await start();

    const preflight = await fetch(plain, { method: 'OPTIONS', headers: { origin: ALLOWED } });

    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe(ALLOWED);
  });

  it('keeps its in-flight slots apart from signed-in requests', async () => {
    const app = createMcpHttpApp({
      docsRoot: FIXTURE_DOCS_ROOT,
      config: testConfig({ auth: testAuth().hostedAuth(PUBLIC_URL), maxInFlight: 1, inFlightWaitMs: 0, rateLimitPerMinute: 0 }),
    });
    const httpServer = createMcpHttpServer(app);
    await new Promise<void>((resolveListening) => httpServer.listen(0, '127.0.0.1', resolveListening));
    const { port } = httpServer.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;
    const stalled = connect(port, '127.0.0.1');
    stalled.on('error', () => undefined);

    try {
      stalled.write(
        'POST /mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\n' +
          'Accept: application/json, text/event-stream\r\nContent-Length: 100\r\n\r\n{"jsonrpc":'
      );
      await new Promise((resolveTick) => setTimeout(resolveTick, 50));

      const openBusy = await postMcp(new URL('/mcp', base), TOOLS_LIST_REQUEST, { authorization: '' });
      const signedIn = await postMcp(new URL(`/mcp/${TEST_REALM}`, base), TOOLS_LIST_REQUEST);

      expect(openBusy.status).toBe(503);
      expect(signedIn.status).toBe(200);
    } finally {
      stalled.destroy();
      httpServer.closeAllConnections();
      await new Promise((resolveClosed) => httpServer.close(resolveClosed));
    }
  });

  it('answers an offline tool call without a token', async () => {
    const { plain } = await start();

    const response = await postMcp(
      plain,
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'list_adsp_docs', arguments: {} } },
      { authorization: '' }
    );

    expect((await response.json()).result.isError).toBeUndefined();
  });

  it('applies the Origin guard', async () => {
    const { plain } = await start();

    const response = await postMcp(plain, TOOLS_LIST_REQUEST, { authorization: '', origin: 'http://evil.test' });

    expect(response.status).toBe(403);
  });

  it('shares one rate limit with the realm endpoints', async () => {
    const { plain, endpoint } = await start({ rateLimitPerMinute: 1, trustedProxy: 'loopback' });
    const client = { 'x-forwarded-for': '203.0.113.10' };

    await (await postMcp(plain, TOOLS_LIST_REQUEST, { ...client, authorization: '' })).text();
    const limited = await postMcp(endpoint, TOOLS_LIST_REQUEST, client);

    expect(limited.status).toBe(429);
  });

  it.each(['GET', 'DELETE'])('answers %s with 405', async (method) => {
    const { plain } = await start();

    const response = await fetch(plain, { method });

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });

  it('serves only plain /mcp without the sign-in settings', async () => {
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: readConfig({}) }));
    const plain = new URL('/mcp', running.endpoint);

    const open = await postMcp(plain, TOOLS_LIST_REQUEST, { authorization: '' });
    const realm = await postMcp(running.endpoint, TOOLS_LIST_REQUEST);
    const metadata = await fetch(new URL(`/.well-known/oauth-protected-resource/mcp/${TEST_REALM}`, plain));

    expect(await listedToolNames(open)).toEqual(OFFLINE_TOOL_NAMES);
    expect(realm.status).toBe(404);
    expect(metadata.status).toBe(404);
  });
});
