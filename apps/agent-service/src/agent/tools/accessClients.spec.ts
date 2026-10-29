import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { createAccessClientTools } from './accessClients';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    __esModule: true,
    default: { ...actual.default, get: jest.fn() },
    isAxiosError: actual.isAxiosError,
  };
});
const mockedGet = axios.get as jest.Mock;

function axiosError(status?: number) {
  const error = new axios.AxiosError('Request failed', status ? 'ERR_BAD_RESPONSE' : 'ECONNABORTED');
  if (status) {
    error.response = { status, data: {}, statusText: '', headers: {}, config: {} as never };
  }
  return error;
}

const DEV_HOST = 'https://access.adsp-dev.gov.ab.ca';
const PROD_HOST = 'https://access.alberta.ca';
const AGENT_USER_ROLE = 'urn:ads:platform:agent-service:agent-user';
const TENANT_URL = 'https://tenant-service.test/api/tenant/v2/tenants/tenant-1';
const tenantId = { toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1' };

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const directory = { getResourceUrl: jest.fn().mockResolvedValue(new URL(TENANT_URL)) };

function createUser(overrides: Partial<User> = {}, realm = 'realm-1', host = DEV_HOST): User {
  return {
    id: 'user-1',
    name: 'Tester',
    email: 'tester@example.com',
    roles: [AGENT_USER_ROLE],
    tenantId,
    isCore: false,
    token: { iss: `${host}/auth/realms/${realm}`, bearer: 'user-token' },
    ...overrides,
  } as unknown as User;
}

function contextFor(user?: User) {
  const values = { user, tenantId };
  return { requestContext: { get: (key: string) => values[key] } } as never;
}

function adminKey(
  path: string,
  params?: Record<string, string | number | boolean>,
  host = DEV_HOST,
  realm = 'realm-1',
) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`
    : '';
  return `${host}/auth/admin/realms/${realm}${path}${query}`;
}

/**
 * Answers GET requests from a table keyed by URL and query string. Any other request fails the test.
 */
function routeRequests(routes: Record<string, unknown>) {
  mockedGet.mockImplementation(
    async (url: string, options?: { params?: Record<string, string | number | boolean> }) => {
      const query = options?.params
        ? `?${new URLSearchParams(Object.entries(options.params).map(([key, value]) => [key, String(value)]))}`
        : '';
      const key = `${url}${query}`;
      if (!(key in routes)) {
        throw new Error(`Unexpected request ${key}`);
      }
      const response = routes[key];
      if (response instanceof Error) {
        throw response;
      }
      return { data: response };
    },
  );
}

const tenantResponse = { realm: 'realm-1', name: 'Tenant One', status: 'active', adminEmail: 'admin@example.com' };
const devEnvironment = { id: 'dev', label: 'Development', host: DEV_HOST, readOnly: true };
const tenantRealm = { realm: 'realm-1', name: 'Tenant One', kind: 'tenant', status: 'active' };

const CLIENT_ID = 'urn:ads:tenant:demo:web-app';
const keycloakClient = {
  id: 'internal-1',
  clientId: CLIENT_ID,
  name: 'Demo web app',
  enabled: true,
  protocol: 'openid-connect',
  publicClient: false,
  bearerOnly: false,
  consentRequired: false,
  standardFlowEnabled: true,
  implicitFlowEnabled: false,
  directAccessGrantsEnabled: false,
  serviceAccountsEnabled: true,
  frontchannelLogout: true,
  fullScopeAllowed: false,
  clientAuthenticatorType: 'client-secret',
  secret: 'super-secret-value',
  redirectUris: ['https://demo.alberta.ca/*'],
  webOrigins: ['https://demo.alberta.ca'],
  defaultClientScopes: ['profile', 'roles'],
  optionalClientScopes: ['offline_access'],
  attributes: { 'pkce.code.challenge.method': 'S256', 'client.secret.rotated': 'rotated-secret-value' },
  protocolMappers: [
    {
      name: 'form audience',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-audience-mapper',
      config: { 'included.client.audience': 'urn:ads:platform:form-service', 'access.token.claim': 'true' },
    },
  ],
};
const clientRoles = [{ name: 'reader', description: 'Can read', composite: false }];
const scopeMappings = {
  clientMappings: {
    'urn:ads:platform:form-service': {
      client: 'urn:ads:platform:form-service',
      mappings: [{ name: 'form-applicant' }],
    },
  },
};

const LIST_KEY = adminKey('/clients', { first: 0, max: 101 });
const LOOKUP_KEY = adminKey('/clients', { clientId: CLIENT_ID });
const CLIENT_KEY = adminKey('/clients/internal-1');

describe('createAccessClientTools', () => {
  const { listAccessClients, getAccessClient } = createAccessClientTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(DEV_HOST),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockReset();
  });

  it('uses the tool name as the tool ID', () => {
    expect(listAccessClients.id).toBe('listAccessClients');
    expect(getAccessClient.id).toBe('getAccessClient');
  });

  describe('listAccessClients', () => {
    it("lists the clients in the user's realm with the user's token", async () => {
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [LIST_KEY]: [keycloakClient, { id: 'internal-2', clientId: 'realm-management', bearerOnly: true }],
      });

      const result = await listAccessClients.execute({}, contextFor(createUser()));

      expect(result).toEqual({
        status: 'available',
        message: 'Found 2 clients in realm Tenant One (realm-1) in Development (read-only).',
        environment: devEnvironment,
        realm: tenantRealm,
        clients: [
          {
            clientId: CLIENT_ID,
            name: 'Demo web app',
            enabled: true,
            type: 'confidential',
            protocol: 'openid-connect',
            builtIn: false,
          },
          { clientId: 'realm-management', type: 'bearer-only', builtIn: true },
        ],
      });
      expect(mockedGet).toHaveBeenCalledWith(`${DEV_HOST}/auth/admin/realms/realm-1/clients`, {
        headers: { Authorization: 'Bearer user-token', Accept: 'application/json' },
        params: { first: 0, max: 101 },
        timeout: 5000,
      });
    });

    it('never returns secrets, tokens or personal details', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [LIST_KEY]: [keycloakClient] });

      const serialized = JSON.stringify(await listAccessClients.execute({}, contextFor(createUser())));

      for (const value of ['super-secret-value', 'rotated-secret-value', 'user-token', 'admin@example.com']) {
        expect(serialized).not.toContain(value);
      }
    });

    it('filters to client IDs containing the trimmed search text', async () => {
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'web', search: true, first: 0, max: 101 })]: [keycloakClient],
      });

      const result = await listAccessClients.execute({ search: '  web ' }, contextFor(createUser()));

      expect(result).toMatchObject({
        status: 'available',
        search: 'web',
        message:
          'Found 1 client with a client ID containing "web" in realm Tenant One (realm-1) in Development (read-only).',
      });
    });

    it('lists all clients when the search text is blank', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [LIST_KEY]: [] });

      const result = await listAccessClients.execute({ search: '   ' }, contextFor(createUser()));

      expect(result).not.toHaveProperty('search');
      expect(result).toMatchObject({
        status: 'available',
        clients: [],
        message:
          'No clients were returned for realm Tenant One (realm-1) in Development. If you expected clients, you may not have permission to view them.',
      });
    });

    it('says when no client matches the search text', async () => {
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'missing', search: true, first: 0, max: 101 })]: [],
      });

      const result = await listAccessClients.execute({ search: 'missing' }, contextFor(createUser()));

      expect(result).toMatchObject({
        status: 'available',
        clients: [],
        message:
          'No clients with a client ID containing "missing" were found in realm Tenant One (realm-1) in Development.',
      });
    });

    it('shows at most 100 clients and says when more exist', async () => {
      const clients = Array.from({ length: 101 }, (_, index) => ({ id: `id-${index}`, clientId: `client-${index}` }));
      routeRequests({ [TENANT_URL]: tenantResponse, [LIST_KEY]: clients });

      const result = await listAccessClients.execute({}, contextFor(createUser()));

      expect(result.clients).toHaveLength(100);
      expect(result.truncated).toBe(true);
      expect(result.message).toBe(
        'Showing the first 100 clients in realm Tenant One (realm-1) in Development (read-only). More clients exist; search by client ID to narrow the list.',
      );
    });

    it('reports NO_CLIENT_PERMISSION, rather than failing, when Keycloak refuses the user', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [LIST_KEY]: axiosError(HttpStatusCodes.FORBIDDEN) });

      const result = await listAccessClients.execute({}, contextFor(createUser()));

      expect(result).toEqual({
        status: 'unavailable',
        reason: 'NO_CLIENT_PERMISSION',
        message:
          'You do not have permission to view clients in this realm. Viewing clients needs the realm-management view-clients role; ask your tenant administrator.',
        environment: devEnvironment,
        realm: tenantRealm,
        clients: [],
      });
    });

    it('reports the missing role without calling any API', async () => {
      const result = await listAccessClients.execute({}, contextFor(createUser({ roles: [] })));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'MISSING_ROLE', clients: [] });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('reports NO_SESSION when there is no user', async () => {
      const result = await listAccessClients.execute({}, contextFor(undefined));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_SESSION', clients: [] });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('reports REALM_MISMATCH without reading clients when the tenant realm differs', async () => {
      routeRequests({ [TENANT_URL]: { ...tenantResponse, realm: 'realm-2' } });

      const result = await listAccessClients.execute({}, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'REALM_MISMATCH', clients: [] });
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('ignores any realm or host the model tries to pass in', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [LIST_KEY]: [] });

      await listAccessClients.execute(
        { realm: 'other-realm', host: 'https://elsewhere.test' } as never,
        contextFor(createUser()),
      );

      const requested = JSON.stringify(mockedGet.mock.calls);
      expect(requested).not.toContain('other-realm');
      expect(requested).not.toContain('elsewhere.test');
    });

    it('lists core realm clients for a core user without reading a tenant', async () => {
      routeRequests({ [adminKey('/clients', { first: 0, max: 101 }, DEV_HOST, 'core')]: [{ clientId: 'core-app' }] });

      const result = await listAccessClients.execute(
        {},
        contextFor(createUser({ isCore: true, tenantId: undefined }, 'core')),
      );

      expect(result).toMatchObject({
        status: 'available',
        realm: { realm: 'core', name: 'Core', kind: 'core' },
        clients: [{ clientId: 'core-app' }],
      });
      expect(directory.getResourceUrl).not.toHaveBeenCalled();
    });

    it('reads clients in Production, read-only, when the agent runs there', async () => {
      const { listAccessClients: listProductionClients } = createAccessClientTools({
        logger: logger as never,
        directory: directory as never,
        accessServiceUrl: new URL(PROD_HOST),
      });
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { first: 0, max: 101 }, PROD_HOST)]: [{ clientId: 'app' }],
      });

      const result = await listProductionClients.execute({}, contextFor(createUser({}, 'realm-1', PROD_HOST)));

      expect(result).toMatchObject({
        status: 'available',
        environment: { id: 'prod', label: 'Production', host: PROD_HOST, readOnly: true },
        clients: [{ clientId: 'app' }],
      });
    });
  });

  describe('getAccessClient', () => {
    const configurationRoutes = {
      [TENANT_URL]: tenantResponse,
      [LOOKUP_KEY]: [keycloakClient],
      [CLIENT_KEY]: keycloakClient,
      [`${CLIENT_KEY}/roles`]: clientRoles,
      [`${CLIENT_KEY}/scope-mappings`]: scopeMappings,
    };

    it('returns the non-sensitive configuration of the client', async () => {
      routeRequests(configurationRoutes);

      const result = await getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser()));

      expect(result).toMatchObject({
        status: 'available',
        message: `Client ${CLIENT_ID} in realm Tenant One (realm-1) in Development (read-only). Secrets and credentials are not included.`,
        environment: devEnvironment,
        realm: tenantRealm,
        clientId: CLIENT_ID,
        client: {
          clientId: CLIENT_ID,
          type: 'confidential',
          authentication: { clientAuthentication: true, authenticator: 'Client ID and secret', pkceMethod: 'S256' },
          redirects: {
            redirectUris: ['https://demo.alberta.ca/*'],
            webOrigins: ['https://demo.alberta.ca'],
            postLogoutRedirectUris: [],
          },
          roles: [{ name: 'reader', description: 'Can read', composite: false }],
          scopes: {
            defaultClientScopes: ['profile', 'roles'],
            optionalClientScopes: ['offline_access'],
            fullScopeAllowed: false,
            clientRoleScopeMappings: [{ clientId: 'urn:ads:platform:form-service', roles: ['form-applicant'] }],
          },
          protocolMappers: [
            {
              name: 'form audience',
              mapperType: 'oidc-audience-mapper',
              settings: { includedClientAudience: 'urn:ads:platform:form-service', addToAccessToken: true },
            },
          ],
        },
      });
      expect(result).not.toHaveProperty('suggestions');
    });

    it('only reads, and never exposes secrets, tokens or personal details', async () => {
      const writes = ['post', 'put', 'patch', 'delete'].map((method) =>
        jest.spyOn(axios, method as 'post' | 'put' | 'patch' | 'delete'),
      );
      routeRequests(configurationRoutes);

      const serialized = JSON.stringify(
        await getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser())),
      );

      for (const write of writes) {
        expect(write).not.toHaveBeenCalled();
      }
      for (const value of ['super-secret-value', 'rotated-secret-value', 'user-token', 'admin@example.com']) {
        expect(serialized).not.toContain(value);
      }
    });

    it('looks up the trimmed client ID', async () => {
      routeRequests(configurationRoutes);

      const result = await getAccessClient.execute({ clientId: `  ${CLIENT_ID} ` }, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'available', clientId: CLIENT_ID });
    });

    it('returns the client Keycloak matched regardless of case, under its real client ID', async () => {
      const upperCaseClientId = CLIENT_ID.toUpperCase();
      routeRequests({
        ...configurationRoutes,
        [adminKey('/clients', { clientId: upperCaseClientId })]: [keycloakClient],
      });

      const result = await getAccessClient.execute({ clientId: upperCaseClientId }, contextFor(createUser()));

      expect(result).toMatchObject({
        status: 'available',
        message: expect.stringContaining(`Client ${CLIENT_ID} in`),
        clientId: upperCaseClientId,
        client: { clientId: CLIENT_ID },
      });
    });

    it('reports CLIENT_NOT_FOUND with client IDs containing the text, rather than inventing a client', async () => {
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'web-app' })]: [],
        [adminKey('/clients', { clientId: 'web-app', search: true, first: 0, max: 5 })]: [
          { clientId: CLIENT_ID, secret: 'super-secret-value' },
        ],
      });

      const result = await getAccessClient.execute({ clientId: 'web-app' }, contextFor(createUser()));

      expect(result).toEqual({
        status: 'not-found',
        reason: 'CLIENT_NOT_FOUND',
        message: 'No client with that client ID could be found in your realm, or you do not have access to it.',
        environment: devEnvironment,
        realm: tenantRealm,
        clientId: 'web-app',
        suggestions: [CLIENT_ID],
      });
    });

    it('reports CLIENT_NOT_FOUND without suggestions when nothing is similar', async () => {
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'missing' })]: [],
        [adminKey('/clients', { clientId: 'missing', search: true, first: 0, max: 5 })]: [],
      });

      const result = await getAccessClient.execute({ clientId: 'missing' }, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'CLIENT_NOT_FOUND' });
      expect(result).not.toHaveProperty('suggestions');
      expect(result).not.toHaveProperty('client');
    });

    it('reports the problem when looking for similar clients fails', async () => {
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'missing' })]: [],
        [adminKey('/clients', { clientId: 'missing', search: true, first: 0, max: 5 })]: axiosError(),
      });

      const result = await getAccessClient.execute({ clientId: 'missing' }, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unreachable', reason: 'ENVIRONMENT_UNREACHABLE', clientId: 'missing' });
    });

    it('reports NO_CLIENT_PERMISSION when Keycloak refuses the lookup', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [LOOKUP_KEY]: axiosError(HttpStatusCodes.FORBIDDEN) });

      const result = await getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_CLIENT_PERMISSION', clientId: CLIENT_ID });
      expect(result).not.toHaveProperty('client');
    });

    it('reports CLIENT_NOT_FOUND when the client disappears while being read', async () => {
      routeRequests({
        ...configurationRoutes,
        [CLIENT_KEY]: axiosError(HttpStatusCodes.NOT_FOUND),
      });

      const result = await getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'CLIENT_NOT_FOUND' });
      expect(result).not.toHaveProperty('client');
    });

    it('reports SESSION_EXPIRED when Keycloak rejects the token', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [LOOKUP_KEY]: axiosError(HttpStatusCodes.UNAUTHORIZED) });

      const result = await getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'SESSION_EXPIRED' });
    });

    it('reports the missing role without calling any API', async () => {
      const result = await getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser({ roles: [] })));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'MISSING_ROLE', clientId: CLIENT_ID });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('rejects a blank client ID without calling any API', async () => {
      const result = await getAccessClient.execute({ clientId: '   ' }, contextFor(createUser()));

      expect(result).toMatchObject({ error: true });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('logs results without the token or personal details', async () => {
      routeRequests(configurationRoutes);

      await getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser()));

      expect(logger.info).toHaveBeenCalledWith(
        "Access client tool 'getAccessClient' completed with status 'available'.",
        expect.objectContaining({ context: 'AccessClientTools', user: 'user-1', environment: 'dev' }),
      );
      expect(JSON.stringify(logger.info.mock.calls)).not.toContain('user-token');
      expect(JSON.stringify(logger.info.mock.calls)).not.toContain('tester@example.com');
    });

    it('logs and rethrows unexpected failures', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [LOOKUP_KEY]: axiosError(HttpStatusCodes.BAD_REQUEST) });

      await expect(getAccessClient.execute({ clientId: CLIENT_ID }, contextFor(createUser()))).rejects.toThrow(
        'Request failed',
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Access client tool 'getAccessClient' failed"),
        expect.objectContaining({ user: 'user-1' }),
      );
    });
  });
});
