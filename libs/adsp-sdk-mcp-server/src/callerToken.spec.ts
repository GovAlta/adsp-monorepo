class MockHttpRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

jest.mock('@abgov/adsp-cli', () => ({
  getAccessToken: jest.fn(),
  getDirectoryServiceUrl: jest.fn(),
  getServiceRoles: jest.fn(),
  getServiceConfigurationSchemas: jest.fn(),
  HttpRequestError: MockHttpRequestError,
  ServiceNotInDirectoryError: class extends Error {},
}));

import {
  getAccessToken,
  getDirectoryServiceUrl,
  getServiceConfigurationSchemas,
  getServiceRoles,
} from '@abgov/adsp-cli';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  endpointFor,
  listen,
  postMcp,
  RunningApp,
  startTestAuth,
  stop,
  stopTestAuth,
  testAuth,
  testConfig,
} from './fixtures/httpTestKit';
import { FIXTURE_DOCS_ROOT } from './fixtures/toolContract';
import { createMcpHttpApp } from './http';
import { createAdspMcpServer, CreateAdspMcpServerOptions } from './server';
import { createConfigurationSchemaTools } from './tools/registerConfigurationSchemaTool';
import { createServiceRolesTools } from './tools/registerServiceRolesTool';

const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetDirectoryServiceUrl = getDirectoryServiceUrl as jest.Mock;
const mockGetServiceRoles = getServiceRoles as jest.Mock;
const mockGetSchemas = getServiceConfigurationSchemas as jest.Mock;

const [listServiceRoles] = createServiceRolesTools();
const [getConfigurationSchema] = createConfigurationSchemaTools();

const CALLER = { accessToken: 'caller-token', directoryServiceUrl: 'https://directory.caller.test' };
const REJECTED_SIGN_IN = 'Your sign-in was rejected or has expired. Sign in again from your MCP client.';

function textOf(result: CallToolResult): string {
  return (result.content[0] as { type: 'text'; text: string }).text;
}

beforeEach(() => {
  mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'cli-token' });
  mockGetDirectoryServiceUrl.mockReturnValue('https://directory.cli.test');
  mockGetServiceRoles.mockResolvedValue([]);
  mockGetSchemas.mockResolvedValue([]);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe.each([
  ['list_service_roles', listServiceRoles, mockGetServiceRoles],
  ['get_service_configuration_schema', getConfigurationSchema, mockGetSchemas],
] as const)('%s with the caller sign-in', (_name, tool, upstream) => {
  it('calls ADSP with the caller token and directory URL, never the CLI login', async () => {
    const result = await tool.handler({}, { caller: CALLER });

    expect(result.isError).toBeUndefined();
    expect(upstream.mock.calls[0].slice(0, 2)).toEqual([CALLER.accessToken, CALLER.directoryServiceUrl]);
    expect(mockGetAccessToken).not.toHaveBeenCalled();
    expect(mockGetDirectoryServiceUrl).not.toHaveBeenCalled();
  });

  it('asks the caller to sign in again when ADSP rejects the token', async () => {
    upstream.mockRejectedValue(new MockHttpRequestError(401, 'unauthorized'));

    const result = await tool.handler({}, { caller: CALLER });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe(REJECTED_SIGN_IN);
  });

  it('points a 403 at the realm in the MCP server URL, not at local settings', async () => {
    upstream.mockRejectedValue(new MockHttpRequestError(403, 'forbidden'));

    const text = textOf(await tool.handler({}, { caller: CALLER }));

    expect(text).toContain('realm in your MCP server URL');
    expect(text).not.toContain('ADSP_');
  });

  it('keeps the CLI login messages without a caller', async () => {
    upstream.mockRejectedValue(new MockHttpRequestError(401, 'unauthorized'));

    const text = textOf(await tool.handler({}));

    expect(text).toContain('npx @abgov/adsp-cli login');
    expect(mockGetAccessToken).toHaveBeenCalled();
  });
});

describe('createAdspMcpServer and the caller sign-in', () => {
  const SIGNED_IN: AuthInfo = { token: 'signed-in-token', clientId: 'adsp-mcp', scopes: [] };

  async function callListServiceRoles(options: CreateAdspMcpServerOptions, authInfo?: AuthInfo) {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const send = clientTransport.send.bind(clientTransport);
    clientTransport.send = (message, sendOptions) => send(message, { ...sendOptions, authInfo });
    const client = new Client({ name: 'test-client', version: '0.0.1' });
    await Promise.all([
      createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT, ...options }).connect(serverTransport),
      client.connect(clientTransport),
    ]);
    const result = (await client.callTool({ name: 'list_service_roles', arguments: {} })) as CallToolResult;
    await client.close();
    return result;
  }

  it('ignores any sign-in without hostedAuth, so stdio keeps using the CLI login', async () => {
    await callListServiceRoles({}, SIGNED_IN);

    expect(mockGetAccessToken).toHaveBeenCalled();
    expect(mockGetServiceRoles).toHaveBeenCalledWith('cli-token', 'https://directory.cli.test');
  });

  it('passes the caller token and the configured directory URL with hostedAuth', async () => {
    await callListServiceRoles({ hostedAuth: { directoryServiceUrl: 'https://directory.hosted.test' } }, SIGNED_IN);

    expect(mockGetServiceRoles).toHaveBeenCalledWith('signed-in-token', 'https://directory.hosted.test');
    expect(mockGetAccessToken).not.toHaveBeenCalled();
  });

  it('never falls back to the CLI login when hostedAuth is set but the request has no sign-in', async () => {
    const result = await callListServiceRoles({ hostedAuth: { directoryServiceUrl: 'https://directory.hosted.test' } });

    expect(result.isError).toBe(true);
    expect(mockGetAccessToken).not.toHaveBeenCalled();
    expect(mockGetServiceRoles).not.toHaveBeenCalled();
  });
});

describe('live tools over HTTP', () => {
  let running: RunningApp | undefined;

  const callTool = (name: string) => ({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name, arguments: {} } });

  beforeAll(startTestAuth);
  afterAll(stopTestAuth);

  afterEach(async () => {
    if (running) {
      await stop(running);
      running = undefined;
    }
  });

  async function start() {
    running = await listen(createMcpHttpApp({ docsRoot: FIXTURE_DOCS_ROOT, config: testConfig() }));
    return running;
  }

  it('tells a caller whose token ADSP rejects to sign in again', async () => {
    mockGetServiceRoles.mockRejectedValue(new MockHttpRequestError(401, 'unauthorized'));
    const { endpoint } = await start();

    const body = await (await postMcp(endpoint, callTool('list_service_roles'))).json();

    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toBe(REJECTED_SIGN_IN);
  });

  it('sends each concurrent caller to ADSP with their own token', async () => {
    let arrived = 0;
    let releaseBoth!: () => void;
    const bothArrived = new Promise<void>((resolveBoth) => (releaseBoth = resolveBoth));
    mockGetServiceRoles.mockImplementation(async () => {
      arrived += 1;
      if (arrived === 2) releaseBoth();
      await bothArrived;
      return [];
    });
    const { endpoint } = await start();
    const tokenA = testAuth().sign('realm-a');
    const tokenB = testAuth().sign('realm-b');

    const responses = await Promise.all([
      postMcp(endpointFor(endpoint, 'realm-a'), callTool('list_service_roles'), { authorization: `Bearer ${tokenA}` }),
      postMcp(endpointFor(endpoint, 'realm-b'), callTool('list_service_roles'), { authorization: `Bearer ${tokenB}` }),
    ]);

    const directoryServiceUrl = testConfig().auth?.directoryServiceUrl;
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(mockGetServiceRoles.mock.calls.map(([token]) => token).sort()).toEqual([tokenA, tokenB].sort());
    expect(mockGetServiceRoles.mock.calls.every(([, url]) => url === directoryServiceUrl)).toBe(true);
    expect(mockGetAccessToken).not.toHaveBeenCalled();
  });
});
