import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { readConfig } from './config';
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
import { createMcpHttpApp } from './http';

const PUBLIC_URL = 'https://mcp.example.test';
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

  it('refuses to build the HTTP app without the sign-in settings', () => {
    expect(() => createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: readConfig({}) })).toThrow(
      /MCP_PUBLIC_URL.*ADSP_ACCESS_SERVICE_URL.*ADSP_DIRECTORY_SERVICE_URL/
    );
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
    expect((await response.json()).result.tools).toHaveLength(11);
  });

  it('rejects a token for another realm', async () => {
    const { endpoint } = await start();

    const response = await postMcp(endpoint, TOOLS_LIST_REQUEST, authHeaders('another-realm'));

    expect(response.status).toBe(401);
  });

  it('no longer serves plain /mcp', async () => {
    const { endpoint } = await start();

    const response = await postMcp(new URL('/mcp', endpoint), TOOLS_LIST_REQUEST);

    expect(response.status).toBe(404);
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
