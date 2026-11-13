import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { createAccessClientCheckTools } from './accessClientChecks';
import type { ModelTextOutput } from './accessModelOutput';
import {
  adminKey,
  CATALOG_URL,
  contextFor,
  createCaller,
  createTestDirectory,
  createTestLogger,
  DEV_HOST,
  devEnvironment,
  httpError,
  PROD_HOST,
  routeRequests,
  TENANT_URL,
  tenantRealm,
  tenantResponse,
} from '../../test/accessToolTestSupport';

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

const APP_ID = 'urn:ads:demo:web-app';
const API_ID = 'urn:ads:demo:api';
const FORM_SERVICE = 'urn:ads:platform:form-service';
const NOW_SECONDS = Math.floor(Date.now() / 1000);

const webApp = {
  id: 'c-app',
  clientId: APP_ID,
  enabled: true,
  publicClient: true,
  standardFlowEnabled: true,
  implicitFlowEnabled: false,
  directAccessGrantsEnabled: false,
  serviceAccountsEnabled: false,
  redirectUris: ['https://app.alberta.ca/*'],
  webOrigins: [],
  attributes: { 'post.logout.redirect.uris': '+', 'pkce.code.challenge.method': 'S256' },
};

const api = {
  id: 'c-api',
  clientId: API_ID,
  enabled: true,
  publicClient: false,
  standardFlowEnabled: false,
  serviceAccountsEnabled: true,
  secret: 'client-secret-value',
  redirectUris: [],
  webOrigins: [],
  attributes: { 'client.secret.creation.time': String(NOW_SECONDS - 400 * 24 * 3600), 'client.secret.rotated': 'old' },
};

function clientRoutes(client: { id: string; clientId: string }) {
  return {
    [adminKey('/clients', { clientId: client.clientId })]: [client],
    [adminKey(`/clients/${client.id}`)]: client,
    [adminKey(`/clients/${client.id}/roles`)]: [],
    [adminKey(`/clients/${client.id}/scope-mappings`)]: {},
  };
}

const serviceAccount = { id: 'sa-1', username: 'service-account-urn:ads:demo:api', enabled: true };
const serviceAccountRoutes = {
  [adminKey('/clients/c-api/service-account-user')]: serviceAccount,
  [adminKey('/users/sa-1/role-mappings')]: { realmMappings: [{ id: 'r-default', name: 'default-roles-realm-1' }] },
  [adminKey('/users/sa-1/groups', { briefRepresentation: true })]: [],
  [adminKey('/users/sa-1/role-mappings/realm/composite')]: [{ id: 'r-default', name: 'default-roles-realm-1' }],
};

const tokenClaims = {
  iss: `${DEV_HOST}/auth/realms/realm-1`,
  aud: ['account'],
  azp: APP_ID,
  sub: 'user-id-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  scope: 'openid profile',
  iat: 100,
  exp: 400,
  resource_access: { account: { roles: ['view-profile'] } },
};

describe('createAccessClientCheckTools', () => {
  const logger = createTestLogger();
  const directory = createTestDirectory();
  const tools = createAccessClientCheckTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(DEV_HOST),
  });
  const productionTools = createAccessClientCheckTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(PROD_HOST),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockReset();
  });

  it('uses the tool names as the tool IDs', () => {
    expect(Object.values(tools).map((tool) => tool.id)).toEqual([
      'checkAccessClientSetup',
      'checkAccessClientUrl',
      'previewAccessToken',
      'getAccessServiceAccount',
    ]);
  });

  describe('checkAccessClientSetup', () => {
    it('lists findings with fixes and the keycloak-js values for a browser app', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });

      const result = await tools.checkAccessClientSetup.execute({ clientId: APP_ID }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'available',
        message: `Checked ${APP_ID} in realm Tenant One (realm-1) in Development (read-only): 0 problems, 1 warnings, 0 tips.`,
        environment: devEnvironment,
        realm: tenantRealm,
        client: { clientId: APP_ID, type: 'public', origin: 'tenant' },
        findings: [expect.objectContaining({ id: 'no-web-origins', severity: 'warning' })],
        setup: { keycloakJs: { url: `${DEV_HOST}/auth`, realm: 'realm-1', clientId: APP_ID } },
      });
    });

    it('checks the service account roles and secret age of a backend service without reading the secret', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(api), ...serviceAccountRoutes });

      const result = await tools.checkAccessClientSetup.execute({ clientId: API_ID }, contextFor(createCaller()));

      expect(result.findings.map((finding) => finding.id)).toEqual(['service-account-no-roles', 'old-secret']);
      expect(result.setup.curl).toContain("client_secret=<client-secret>'");
      expect(result.secretCreatedAt).toBeDefined();
      expect(JSON.stringify(result)).not.toContain('client-secret-value');
      expect(mockedGet).not.toHaveBeenCalledWith(expect.stringContaining('client-secret'), expect.anything());
    });

    it('suggests the real client when the model made up a URN from an app name', async () => {
      routeRequests(mockedGet, {
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'urn:ads:demo:role-test-app' })]: [],
        [adminKey('/clients', { first: 0, max: 500 })]: [{ id: 'c-rt', clientId: 'role-test' }, webApp],
      });

      const result = await tools.checkAccessClientSetup.execute(
        { clientId: 'urn:ads:demo:role-test-app' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({ status: 'not-found', reason: 'CLIENT_NOT_FOUND', suggestions: ['role-test'] });
    });

    it('reports CLIENT_NOT_FOUND with similar client IDs', async () => {
      routeRequests(mockedGet, {
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'web' })]: [],
        [adminKey('/clients', { first: 0, max: 500 })]: [webApp, api],
      });

      const result = await tools.checkAccessClientSetup.execute({ clientId: 'web' }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'CLIENT_NOT_FOUND', suggestions: [APP_ID] });
    });

    it.each([
      `client: ${APP_ID}: public, enabled, origin tenant, no service account`,
      'findings (1):\n- warning no-web-origins: ',
      `issuer: ${DEV_HOST}/auth/realms/realm-1`,
      `keycloak-js settings: url=${DEV_HOST}/auth, realm=realm-1, clientId=${APP_ID}`,
    ])('gives the model the setup fact "%s" for a browser app', async (fact) => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });
      const result = await tools.checkAccessClientSetup.execute({ clientId: APP_ID }, contextFor(createCaller()));

      const { value } = tools.checkAccessClientSetup.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(fact);
    });

    it.each([
      /- warning service-account-no-roles: .+ Fix: .+/,
      /- tip old-secret: .+ Fix: .+/,
      /token request: curl .*client_secret=<client-secret>'/,
      /secret created: \d{4}-\d{2}-\d{2} \d{2}:\d{2}Z/,
    ])('gives the model the backend service fact %s', async (fact) => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(api), ...serviceAccountRoutes });
      const result = await tools.checkAccessClientSetup.execute({ clientId: API_ID }, contextFor(createCaller()));

      const { value } = tools.checkAccessClientSetup.toModelOutput(result) as ModelTextOutput;

      expect(value).toMatch(fact);
    });

    it('never gives the model the client secret', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(api), ...serviceAccountRoutes });
      const result = await tools.checkAccessClientSetup.execute({ clientId: API_ID }, contextFor(createCaller()));

      const { value } = tools.checkAccessClientSetup.toModelOutput(result) as ModelTextOutput;

      expect(value).not.toContain('client-secret-value');
    });

    it('gives the model the client ID and suggestions when no client has the ID', async () => {
      routeRequests(mockedGet, {
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: 'web' })]: [],
        [adminKey('/clients', { first: 0, max: 500 })]: [webApp, api],
      });
      const result = await tools.checkAccessClientSetup.execute({ clientId: 'web' }, contextFor(createCaller()));

      const { value } = tools.checkAccessClientSetup.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(`client ID: web\nsuggestions: ${APP_ID}`);
    });
  });

  describe('checkAccessClientUrl', () => {
    it('says which settings allow the address and what to add for the rest', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });

      const result = await tools.checkAccessClientUrl.execute(
        { clientId: APP_ID, url: 'https://app.alberta.ca/callback' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({
        status: 'available',
        message: `Checked https://app.alberta.ca/callback against ${APP_ID} in realm Tenant One (realm-1) in Development (read-only): 2 of 3 checks allow it.`,
        check: {
          redirect: { allowed: true, matchedBy: 'https://app.alberta.ca/*' },
          webOrigin: { allowed: false },
          postLogout: { allowed: true },
          suggestions: { webOrigin: 'https://app.alberta.ca' },
        },
      });
    });

    it('reports INVALID_URL for an address without a scheme', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });

      const result = await tools.checkAccessClientUrl.execute(
        { clientId: APP_ID, url: 'app.alberta.ca/callback' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({ status: 'unavailable', reason: 'INVALID_URL' });
      expect(result).not.toHaveProperty('check');
    });

    it.each([
      `client ID: ${APP_ID}`,
      'url: https://app.alberta.ca/callback (origin https://app.alberta.ca)',
      'redirect URI: allowed; matched by https://app.alberta.ca/*',
      'web origin: not allowed; add https://app.alberta.ca',
      'post-logout redirect URI: allowed',
    ])('gives the model the address check "%s"', async (fact) => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });
      const result = await tools.checkAccessClientUrl.execute(
        { clientId: APP_ID, url: 'https://app.alberta.ca/callback' },
        contextFor(createCaller()),
      );

      const { value } = tools.checkAccessClientUrl.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(fact);
    });
  });

  describe('previewAccessToken', () => {
    const userRoutes = {
      [adminKey('/users', { username: 'jdoe', exact: true, briefRepresentation: true })]: [
        { id: 'user-id-1', username: 'jdoe' },
      ],
      [adminKey('/users/user-id-1')]: { id: 'user-id-1', username: 'jdoe', email: 'jane@example.com' },
    };

    const personTokenRoutes = {
      [TENANT_URL]: tenantResponse,
      ...clientRoutes(webApp),
      ...userRoutes,
      [adminKey('/clients/c-app/evaluate-scopes/generate-example-access-token', {
        scope: 'openid profile',
        userId: 'user-id-1',
      })]: tokenClaims,
      [adminKey('/clients/c-app/evaluate-scopes/protocol-mappers', { scope: 'openid profile' })]: [
        {
          mapperName: 'full name',
          containerType: 'client-scope',
          containerName: 'profile',
          protocolMapper: 'oidc-full-name-mapper',
        },
      ],
    };

    it("previews a person's token with claim names but not their values", async () => {
      routeRequests(mockedGet, personTokenRoutes);

      const result = await tools.previewAccessToken.execute(
        { clientId: APP_ID, user: 'jdoe', scope: 'profile openid' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({
        status: 'available',
        search: 'jdoe',
        preview: {
          app: APP_ID,
          subject: 'user',
          scope: 'openid profile',
          audience: ['account'],
          lifetimeSeconds: 300,
          claimNames: expect.arrayContaining(['email', 'name']),
          mappers: [expect.objectContaining({ name: 'full name', from: 'client-scope', scope: 'profile' })],
        },
      });
      const serialized = JSON.stringify({ ...result, preview: { ...result.preview, claimNames: [] } });
      for (const value of ['jane@example.com', 'Jane Doe', 'user-id-1']) {
        expect(serialized).not.toContain(value);
      }
    });

    it("previews the app's service account token when no person is given", async () => {
      routeRequests(mockedGet, {
        [TENANT_URL]: tenantResponse,
        ...clientRoutes(api),
        ...serviceAccountRoutes,
        [adminKey('/clients/c-api/evaluate-scopes/generate-example-access-token', { scope: 'openid', userId: 'sa-1' })]:
          {
            aud: FORM_SERVICE,
          },
        [adminKey('/clients/c-api/evaluate-scopes/protocol-mappers', { scope: 'openid' })]: [],
      });

      const result = await tools.previewAccessToken.execute({ clientId: API_ID }, contextFor(createCaller()));

      expect(result.preview).toMatchObject({ subject: 'service-account', audience: [FORM_SERVICE] });
    });

    it('reports NO_SERVICE_ACCOUNT for a browser app without a person', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });

      const result = await tools.previewAccessToken.execute({ clientId: APP_ID }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'NO_SERVICE_ACCOUNT' });
    });

    it("refuses a person's token in Production but allows a service account token", async () => {
      const person = await productionTools.previewAccessToken.execute(
        { clientId: APP_ID, user: 'jdoe' },
        contextFor(createCaller(PROD_HOST)),
      );
      expect(person).toMatchObject({ status: 'unavailable', reason: 'USER_INSPECTION_NOT_ALLOWED' });
      expect(mockedGet).not.toHaveBeenCalled();

      routeRequests(mockedGet, {
        [TENANT_URL]: tenantResponse,
        ...Object.fromEntries(
          Object.entries({
            ...clientRoutes(api),
            ...serviceAccountRoutes,
            [adminKey('/clients/c-api/evaluate-scopes/generate-example-access-token', {
              scope: 'openid',
              userId: 'sa-1',
            })]: { aud: 'x' },
            [adminKey('/clients/c-api/evaluate-scopes/protocol-mappers', { scope: 'openid' })]: [],
          }).map(([key, value]) => [key.replace(DEV_HOST, PROD_HOST), value]),
        ),
      });

      const service = await productionTools.previewAccessToken.execute(
        { clientId: API_ID },
        contextFor(createCaller(PROD_HOST)),
      );
      expect(service.status).toBe('available');
    });

    it('rejects scopes with unexpected characters without calling any API', async () => {
      const result = await tools.previewAccessToken.execute(
        { clientId: APP_ID, scope: 'openid&userId=other' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({ error: true });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it.each([
      'person searched for: "jdoe"',
      `token preview: user token from ${APP_ID}, requested scope "openid profile" (no token was issued)`,
      'audience: account',
      `authorized party: ${APP_ID}`,
      'scopes: openid, profile',
      'client roles (1):\n- account: view-profile',
      'lifetime: 300s',
      'claim names (values not shown): aud, azp, email, exp, iat, iss, name, resource_access, scope, sub',
      'mappers (1):\n- full name (oidc-full-name-mapper) from client scope profile: Adds the full name',
    ])('gives the model the token fact "%s"', async (fact) => {
      routeRequests(mockedGet, personTokenRoutes);
      const result = await tools.previewAccessToken.execute(
        { clientId: APP_ID, user: 'jdoe', scope: 'profile openid' },
        contextFor(createCaller()),
      );

      const { value } = tools.previewAccessToken.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(fact);
    });

    it.each(['jane@example.com', 'Jane Doe', 'user-id-1'])(
      "never gives the model the claim value %s of a person's token",
      async (claimValue) => {
        routeRequests(mockedGet, personTokenRoutes);
        const result = await tools.previewAccessToken.execute(
          { clientId: APP_ID, user: 'jdoe', scope: 'profile openid' },
          contextFor(createCaller()),
        );

        const { value } = tools.previewAccessToken.toModelOutput(result) as ModelTextOutput;

        expect(value).not.toContain(claimValue);
      },
    );

    it('gives the model the validation error for input it must correct', async () => {
      const result = await tools.previewAccessToken.execute(
        { clientId: APP_ID, scope: 'openid&userId=other' },
        contextFor(createCaller()),
      );

      const { value } = tools.previewAccessToken.toModelOutput(result) as ModelTextOutput;

      expect(JSON.parse(value)).toMatchObject({ error: true, message: expect.stringContaining('scope') });
    });
  });

  describe('getAccessServiceAccount', () => {
    const serviceCheckRoutes = {
      [TENANT_URL]: tenantResponse,
      ...clientRoutes(api),
      ...serviceAccountRoutes,
      [`${CATALOG_URL}?core=true`]: {
        latest: { configuration: { [FORM_SERVICE]: { roles: [{ role: 'form-admin' }] } } },
      },
      [CATALOG_URL]: { latest: { configuration: {} } },
      [adminKey('/clients/c-api/evaluate-scopes/generate-example-access-token', { scope: 'openid', userId: 'sa-1' })]: {
        aud: ['account'],
      },
    };

    it('shows roles, secret age and how to get a token, and checks a named service', async () => {
      routeRequests(mockedGet, serviceCheckRoutes);

      const result = await tools.getAccessServiceAccount.execute(
        { clientId: API_ID, service: 'form service' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({
        status: 'available',
        message: `Service account of ${API_ID} in realm Tenant One (realm-1) in Development (read-only): 1 roles assigned directly and 0 inherited.`,
        serviceAccount: { username: 'service-account-urn:ads:demo:api', enabled: true },
        roles: { counts: { direct: 1, inherited: 0 } },
        services: [
          {
            service: FORM_SERVICE,
            roles: [{ role: 'form-admin', has: false, inToken: false }],
            token: { app: API_ID, audienceIncluded: false },
          },
        ],
        setup: { curl: expect.stringContaining('<client-secret>') },
      });
      expect(result.serviceAccount.secretCreatedAt).toBeDefined();
      expect(JSON.stringify(result)).not.toContain('client-secret-value');
    });

    it('reports NO_SERVICE_ACCOUNT for a client without one', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });

      const result = await tools.getAccessServiceAccount.execute({ clientId: APP_ID }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'NO_SERVICE_ACCOUNT', clientId: APP_ID });
    });

    it('reports NO_CLIENT_PERMISSION when Keycloak refuses the lookup', async () => {
      routeRequests(mockedGet, {
        [TENANT_URL]: tenantResponse,
        [adminKey('/clients', { clientId: API_ID })]: httpError(HttpStatusCodes.FORBIDDEN),
      });

      const result = await tools.getAccessServiceAccount.execute({ clientId: API_ID }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_CLIENT_PERMISSION' });
    });

    it.each([
      /service account: service-account-urn:ads:demo:api, enabled, secret created \d{4}-\d{2}-\d{2} \d{2}:\d{2}Z/,
      /roles: 1 direct, 0 inherited; groups: none\n- realm: default-roles-realm-1 ← direct/,
      new RegExp(`service ${FORM_SERVICE} \\(roles from platform\\)\ntoken from ${API_ID}: audience not included`),
      /- form-admin: missing, not a tenant-admin default, not in token/,
      /token request: curl .*client_secret=<client-secret>'/,
    ])('gives the model the service account fact %s', async (fact) => {
      routeRequests(mockedGet, serviceCheckRoutes);
      const result = await tools.getAccessServiceAccount.execute(
        { clientId: API_ID, service: 'form service' },
        contextFor(createCaller()),
      );

      const { value } = tools.getAccessServiceAccount.toModelOutput(result) as ModelTextOutput;

      expect(value).toMatch(fact);
    });

    it('gives the model the reason when the client has no service account', async () => {
      routeRequests(mockedGet, { [TENANT_URL]: tenantResponse, ...clientRoutes(webApp) });
      const result = await tools.getAccessServiceAccount.execute({ clientId: APP_ID }, contextFor(createCaller()));

      const { value } = tools.getAccessServiceAccount.toModelOutput(result) as ModelTextOutput;

      expect(value).toMatch(/^status: not-found \(NO_SERVICE_ACCOUNT\): This client does not have a service account\./);
    });
  });
});
