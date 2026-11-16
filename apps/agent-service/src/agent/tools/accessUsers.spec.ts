import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import type { AccessUserRoles } from '../agents/access/discovery';
import type { ModelTextOutput } from './accessModelOutput';
import { createAccessUserTools } from './accessUsers';

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
const CONFIGURATION_URL = 'https://configuration-service.test/configuration/v2';
const CATALOG_URL = 'https://configuration-service.test/configuration/v2/configuration/platform/tenant-service';
const directory = {
  getResourceUrl: jest.fn().mockResolvedValue(new URL(TENANT_URL)),
  getServiceUrl: jest.fn().mockResolvedValue(new URL(CONFIGURATION_URL)),
};

function createCaller(overrides: Partial<User> = {}, host = DEV_HOST): User {
  return {
    id: 'caller-1',
    name: 'Caller',
    email: 'caller@example.com',
    roles: [AGENT_USER_ROLE],
    tenantId,
    isCore: false,
    token: { iss: `${host}/auth/realms/realm-1`, bearer: 'caller-token' },
    ...overrides,
  } as unknown as User;
}

function contextFor(user?: User) {
  const values = { user, tenantId };
  return { requestContext: { get: (key: string) => values[key] } } as never;
}

function adminKey(path: string, params?: Record<string, string | number | boolean>, host = DEV_HOST) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`
    : '';
  return `${host}/auth/admin/realms/realm-1${path}${query}`;
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

const USERNAME = 'jdoe';
const EMAIL = 'jane.doe@example.com';
const USER_ID = 'user-id-1';
const TENANT_SERVICE = 'urn:ads:platform:tenant-service';

const keycloakUser = {
  id: USER_ID,
  username: USERNAME,
  email: EMAIL,
  firstName: 'Jane',
  lastName: 'Doe',
  enabled: true,
  emailVerified: true,
  attributes: { phone: ['780-555-0100'] },
  access: { manage: true },
  requiredActions: [],
  federatedIdentities: [{ identityProvider: 'core', userId: 'idp-user-id-9', userName: 'jdoe-at-core' }],
};

const defaultRoles = {
  id: 'r-default',
  name: 'default-roles-realm-1',
  composite: true,
  clientRole: false,
  containerId: 'realm-1',
};
const offlineAccess = {
  id: 'r-offline',
  name: 'offline_access',
  composite: false,
  clientRole: false,
  containerId: 'realm-1',
};
const roleTest = { id: 'r-test', name: 'role-test', composite: false, clientRole: false, containerId: 'realm-1' };
const tenantAdmin = { id: 't-admin', name: 'tenant-admin', composite: true, clientRole: true, containerId: 'c-tenant' };
const viewProfile = {
  id: 'a-view',
  name: 'view-profile',
  composite: false,
  clientRole: true,
  containerId: 'c-account',
};

const EXACT_USERNAME_KEY = adminKey('/users', { username: USERNAME, exact: true, briefRepresentation: true });
const USER_KEY = adminKey(`/users/${USER_ID}`);
const ROLE_MAPPINGS_KEY = adminKey(`/users/${USER_ID}/role-mappings`);
const COMPOSITES_KEY = adminKey('/roles-by-id/r-default/composites');

const findRoutes = {
  [TENANT_URL]: tenantResponse,
  [EXACT_USERNAME_KEY]: [keycloakUser],
  [USER_KEY]: keycloakUser,
};

const roleRoutes = {
  ...findRoutes,
  [ROLE_MAPPINGS_KEY]: {
    realmMappings: [defaultRoles],
    clientMappings: { [TENANT_SERVICE]: { id: 'c-tenant', client: TENANT_SERVICE, mappings: [tenantAdmin] } },
  },
  [adminKey(`/users/${USER_ID}/groups`, { briefRepresentation: true })]: [],
  [adminKey(`/users/${USER_ID}/role-mappings/realm/composite`)]: [defaultRoles, offlineAccess, roleTest],
  [COMPOSITES_KEY]: [offlineAccess, viewProfile],
  [adminKey('/roles-by-id/t-admin/composites')]: [roleTest],
  [adminKey('/clients/c-account')]: { id: 'c-account', clientId: 'account', secret: 'client-secret-value' },
};

function notFoundRoutes(search: string, similar: unknown[]) {
  return {
    [TENANT_URL]: tenantResponse,
    [adminKey('/users', { username: search, exact: true, briefRepresentation: true })]: [],
    [adminKey('/users', { email: search, exact: true, briefRepresentation: true })]: [],
    [adminKey('/clients', { clientId: search })]: [],
    [adminKey('/users', { search, first: 0, max: 6, briefRepresentation: true })]: similar,
    [adminKey('/users', { search: `*${search}*`, first: 0, max: 6, briefRepresentation: true })]: [],
  };
}

const identifyingUser = {
  id: USER_ID,
  username: USERNAME,
  enabled: true,
  emailVerified: true,
  requiredActions: [],
  identityProviders: ['core'],
};

const PERSONAL_VALUES = [
  EMAIL,
  'Jane',
  '780-555-0100',
  'idp-user-id-9',
  'jdoe-at-core',
  'caller-token',
  'client-secret-value',
];

const PLATFORM_SERVICES = [
  'form-service',
  'file-service',
  'notification-service',
  'task-service',
  'calendar-service',
  'event-service',
  'value-service',
  'script-service',
  'pdf-service',
  'configuration-service',
  'directory-service',
  'status-service',
  'push-service',
  'comment-service',
  'feedback-service',
  'cache-service',
  'export-service',
  'agent-service',
];
const viaDefaultRoles = [{ type: 'composite' as const, via: [{ name: 'default-roles-realm-1' }] }];
const viaTenantAdmin = [{ type: 'composite' as const, via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] }];

function inheritedRole(name: string, description: string, sources: AccessUserRoles['realmRoles'][number]['sources']) {
  return { name, description, composite: false, inherited: true, sources };
}

/**
 * Role assignments of a tenant administrator: the tenant-admin composite role gives a few roles on each platform
 * service, which is what makes the raw result large.
 */
const tenantAdministratorRoles: AccessUserRoles = {
  realmRoles: [
    { name: 'default-roles-realm-1', composite: true, inherited: false, sources: [{ type: 'direct' }] },
    inheritedRole('offline_access', 'Allows offline access to the realm for refresh tokens.', viaDefaultRoles),
    inheritedRole('uma_authorization', 'Allows the user to manage their resource permissions.', viaDefaultRoles),
  ],
  clientRoles: [
    {
      clientId: 'account',
      roles: [
        inheritedRole('manage-account', 'Allows the user to manage their own account.', viaDefaultRoles),
        inheritedRole('view-profile', 'Allows the user to view their own profile.', viaDefaultRoles),
      ],
    },
    ...PLATFORM_SERVICES.map((service) => ({
      clientId: `urn:ads:platform:${service}`,
      roles: ['admin', 'reader', 'writer'].map((access) =>
        inheritedRole(
          `${service.replace(/-service$/, '')}-${access}`,
          `Gives ${access} access to the ${service} resources of the tenant.`,
          viaTenantAdmin,
        ),
      ),
    })),
    {
      clientId: TENANT_SERVICE,
      roles: [
        {
          name: 'tenant-admin',
          description: 'Administrator of the tenant.',
          composite: true,
          inherited: false,
          sources: [{ type: 'direct' }, { type: 'group', group: '/tenant-admins' }],
        },
      ],
    },
  ],
  groups: ['/tenant-admins'],
  counts: { direct: 2, inherited: 58 },
};

describe('createAccessUserTools', () => {
  const {
    findAccessUser,
    getAccessUserRoles,
    getAccessUserSignInStatus,
    checkAccessUserForService,
    compareAccessUsers,
  } = createAccessUserTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(DEV_HOST),
  });
  const productionTools = createAccessUserTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(PROD_HOST),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockReset();
  });

  it('uses the tool name as the tool ID', () => {
    expect(findAccessUser.id).toBe('findAccessUser');
    expect(getAccessUserRoles.id).toBe('getAccessUserRoles');
  });

  describe('findAccessUser', () => {
    it("finds the user in the caller's realm and returns only identifying details", async () => {
      routeRequests(findRoutes);

      const result = await findAccessUser.execute({ user: ` ${USERNAME} ` }, contextFor(createCaller()));

      expect(result).toEqual({
        status: 'available',
        message: 'Found user jdoe in realm Tenant One (realm-1) in Development (read-only).',
        environment: devEnvironment,
        realm: tenantRealm,
        search: USERNAME,
        matchedBy: 'username',
        user: identifyingUser,
      });
    });

    it('finds a person by name and asks to confirm the match, without returning the name', async () => {
      routeRequests({
        ...notFoundRoutes('Jane Doe', [{ id: USER_ID, username: USERNAME, firstName: 'Jane', lastName: 'Doe' }]),
        [USER_KEY]: keycloakUser,
      });

      const result = await findAccessUser.execute({ user: 'Jane Doe' }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'available',
        matchedBy: 'search',
        user: identifyingUser,
        message:
          'Found user jdoe in realm Tenant One (realm-1) in Development (read-only). Matched "Jane Doe" to username ' +
          'jdoe by searching names; confirm this is the person you meant.',
      });
      expect(mockedGet).not.toHaveBeenCalledWith(expect.stringContaining('/clients'), expect.anything());
    });

    it("finds an app's service account by the app's client ID", async () => {
      const serviceAccount = { id: 'sa-1', username: 'service-account-urn:ads:demo:api', enabled: true };
      routeRequests({
        ...notFoundRoutes('urn:ads:demo:api', []),
        [adminKey('/clients', { clientId: 'urn:ads:demo:api' })]: [{ id: 'c-api', clientId: 'urn:ads:demo:api' }],
        [adminKey('/clients/c-api/service-account-user')]: serviceAccount,
        [adminKey('/users/sa-1')]: serviceAccount,
      });

      const result = await findAccessUser.execute({ user: 'urn:ads:demo:api' }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'available',
        matchedBy: 'service-account',
        user: { id: 'sa-1', username: 'service-account-urn:ads:demo:api' },
      });
    });

    it('finds the user by exact email when no username matches', async () => {
      routeRequests({
        [TENANT_URL]: tenantResponse,
        [adminKey('/users', { username: EMAIL, exact: true, briefRepresentation: true })]: [],
        [adminKey('/users', { email: EMAIL, exact: true, briefRepresentation: true })]: [keycloakUser],
        [USER_KEY]: keycloakUser,
      });

      const result = await findAccessUser.execute({ user: EMAIL }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'available', user: identifyingUser });
    });

    it('never returns email, names, attributes, identity provider user details, tokens or secrets', async () => {
      routeRequests(findRoutes);

      const serialized = JSON.stringify(await findAccessUser.execute({ user: USERNAME }, contextFor(createCaller())));

      for (const value of PERSONAL_VALUES) {
        expect(serialized).not.toContain(value);
      }
    });

    it('reports USER_AMBIGUOUS with the usernames of everyone who matches, rather than picking one', async () => {
      routeRequests(
        notFoundRoutes('jdo', [
          { id: 'a', username: 'jdoe', email: 'jane.doe@example.com', firstName: 'Jane' },
          { id: 'b', username: 'JDO' },
          { id: 'c', username: 'jdoe2', email: 'other@example.com' },
        ]),
      );

      const result = await findAccessUser.execute({ user: 'jdo' }, contextFor(createCaller()));

      expect(result).toEqual({
        status: 'not-found',
        reason: 'USER_AMBIGUOUS',
        message: 'More than one user matches. Choose one of the usernames listed.',
        environment: devEnvironment,
        realm: tenantRealm,
        search: 'jdo',
        suggestions: ['jdoe', 'JDO', 'jdoe2'],
      });
      expect(JSON.stringify(result)).not.toContain('example.com');
    });

    it('suggests at most five usernames', async () => {
      const similar = Array.from({ length: 6 }, (_, index) => ({ id: `id-${index}`, username: `jdoe${index}` }));
      routeRequests(notFoundRoutes('jdoe', similar));

      const result = await findAccessUser.execute({ user: 'jdoe' }, contextFor(createCaller()));

      expect(result.suggestions).toEqual(['jdoe0', 'jdoe1', 'jdoe2', 'jdoe3', 'jdoe4']);
    });

    it('reports USER_NOT_FOUND without suggestions when nothing is close', async () => {
      routeRequests(notFoundRoutes('nobody', []));

      const result = await findAccessUser.execute({ user: 'nobody' }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'USER_NOT_FOUND' });
      expect(result).not.toHaveProperty('suggestions');
      expect(result).not.toHaveProperty('user');
    });

    it('does not read anything in Production', async () => {
      const result = await productionTools.findAccessUser.execute(
        { user: USERNAME },
        contextFor(createCaller({}, PROD_HOST)),
      );

      expect(result).toEqual({
        status: 'unavailable',
        reason: 'USER_INSPECTION_NOT_ALLOWED',
        message:
          'Users and their role assignments cannot be inspected in this environment. Inspect the user in Development or UAT instead.',
        environment: { id: 'prod', label: 'Production', host: PROD_HOST, readOnly: true },
        search: USERNAME,
      });
      expect(mockedGet).not.toHaveBeenCalled();
      expect(directory.getResourceUrl).not.toHaveBeenCalled();
    });

    it('reports NO_USER_PERMISSION, rather than failing, when Keycloak refuses the caller', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [EXACT_USERNAME_KEY]: axiosError(HttpStatusCodes.FORBIDDEN) });

      const result = await findAccessUser.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_USER_PERMISSION', search: USERNAME });
      expect(result.message).toContain('tenant admin group');
    });

    it('reports USER_NOT_FOUND when the user disappears while being read', async () => {
      routeRequests({ ...findRoutes, [USER_KEY]: axiosError(HttpStatusCodes.NOT_FOUND) });

      const result = await findAccessUser.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'USER_NOT_FOUND' });
    });

    it('reports the missing role without calling any API', async () => {
      const result = await findAccessUser.execute({ user: USERNAME }, contextFor(createCaller({ roles: [] })));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'MISSING_ROLE', search: USERNAME });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('rejects a blank user without calling any API', async () => {
      const result = await findAccessUser.execute({ user: '   ' }, contextFor(createCaller()));

      expect(result).toMatchObject({ error: true });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('ignores any realm or host the model tries to pass in', async () => {
      routeRequests(findRoutes);

      await findAccessUser.execute(
        { user: USERNAME, realm: 'other-realm', host: 'https://elsewhere.test' } as never,
        contextFor(createCaller()),
      );

      const requested = JSON.stringify(mockedGet.mock.calls);
      expect(requested).not.toContain('other-realm');
      expect(requested).not.toContain('elsewhere.test');
    });

    it('logs the outcome without the searched user, the token or personal details', async () => {
      routeRequests(findRoutes);

      await findAccessUser.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(logger.info).toHaveBeenCalledWith(
        "Access user tool 'findAccessUser' completed with status 'available'.",
        expect.objectContaining({ context: 'AccessUserTools', user: 'caller-1', environment: 'dev' }),
      );
      const logged = JSON.stringify(logger.info.mock.calls);
      for (const value of [USERNAME, USER_ID, 'caller-token', 'caller@example.com']) {
        expect(logged).not.toContain(value);
      }
    });
  });

  describe('findAccessUser model output', () => {
    it('gives the model who was found, how, and the environment and realm on one line', async () => {
      routeRequests(findRoutes);
      const result = await findAccessUser.execute({ user: USERNAME }, contextFor(createCaller()));

      const { value } = findAccessUser.toModelOutput(result) as ModelTextOutput;

      expect(value).toBe(
        'status: available\n' +
          'env: Development (dev, read-only); realm: Tenant One (realm-1, tenant, active)\n' +
          'user: jdoe (id user-id-1, matched by username): enabled; email verified; required actions: none; ' +
          'identity providers: core',
      );
    });

    it('asks the model to confirm a person found by searching names', async () => {
      routeRequests({
        ...notFoundRoutes('Jane Doe', [{ id: USER_ID, username: USERNAME, firstName: 'Jane', lastName: 'Doe' }]),
        [USER_KEY]: keycloakUser,
      });
      const result = await findAccessUser.execute({ user: 'Jane Doe' }, contextFor(createCaller()));

      const { value } = findAccessUser.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        'Matched "Jane Doe" to username jdoe by searching names; confirm this is the person you meant.',
      );
    });

    it('gives the model the reason and the usernames to choose from when several people match', async () => {
      routeRequests(
        notFoundRoutes('jdo', [
          { id: 'a', username: 'jdoe' },
          { id: 'b', username: 'jdoe2' },
        ]),
      );
      const result = await findAccessUser.execute({ user: 'jdo' }, contextFor(createCaller()));

      const { value } = findAccessUser.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        'status: not-found (USER_AMBIGUOUS): More than one user matches. Choose one of the usernames listed.\n' +
          'env: Development (dev, read-only); realm: Tenant One (realm-1, tenant, active)\n' +
          'user searched for: "jdo"\n' +
          'suggestions: jdoe, jdoe2',
      );
    });

    it.each(PERSONAL_VALUES)('never gives the model the personal or secret value %s', async (personal) => {
      routeRequests(findRoutes);
      const result = await findAccessUser.execute({ user: USERNAME }, contextFor(createCaller()));

      const { value } = findAccessUser.toModelOutput(result) as ModelTextOutput;

      expect(value).not.toContain(personal);
    });
  });

  describe('getAccessUserRoles', () => {
    it('returns realm roles and client roles by client, marking inherited roles and where they come from', async () => {
      routeRequests(roleRoutes);

      const result = await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'available',
        message:
          'Role assignments of jdoe in realm Tenant One (realm-1) in Development (read-only): 2 assigned directly and 3 inherited.',
        environment: devEnvironment,
        realm: tenantRealm,
        search: USERNAME,
        user: identifyingUser,
      });
      expect(result.roles).toEqual({
        realmRoles: [
          { name: 'default-roles-realm-1', composite: true, inherited: false, sources: [{ type: 'direct' }] },
          {
            name: 'offline_access',
            composite: false,
            inherited: true,
            sources: [{ type: 'composite', via: [{ name: 'default-roles-realm-1' }] }],
          },
          {
            name: 'role-test',
            composite: false,
            inherited: true,
            sources: [{ type: 'composite', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] }],
          },
        ],
        clientRoles: [
          {
            clientId: 'account',
            roles: [
              {
                name: 'view-profile',
                composite: false,
                inherited: true,
                sources: [{ type: 'composite', via: [{ name: 'default-roles-realm-1' }] }],
              },
            ],
          },
          {
            clientId: TENANT_SERVICE,
            roles: [{ name: 'tenant-admin', composite: true, inherited: false, sources: [{ type: 'direct' }] }],
          },
        ],
        groups: [],
        counts: { direct: 2, inherited: 3 },
      });
    });

    it('only reads from the Keycloak Admin API of the caller realm and the tenant record', async () => {
      routeRequests(roleRoutes);

      await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()));

      for (const [url] of mockedGet.mock.calls) {
        expect(url === TENANT_URL || url.startsWith(`${DEV_HOST}/auth/admin/realms/realm-1/`)).toBe(true);
      }
    });

    it('never returns email, names, attributes, identity provider user details, tokens or secrets', async () => {
      routeRequests(roleRoutes);

      const serialized = JSON.stringify(
        await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller())),
      );

      for (const value of PERSONAL_VALUES) {
        expect(serialized).not.toContain(value);
      }
    });

    it('says the list may be incomplete when inherited roles cannot be traced', async () => {
      routeRequests({ ...roleRoutes, [COMPOSITES_KEY]: axiosError(HttpStatusCodes.FORBIDDEN) });

      const result = await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result.status).toBe('available');
      expect(result.roles.incomplete).toBe(true);
      expect(result.message).toContain('Some inherited roles could not be traced, so the list may be incomplete.');
    });

    it('reports USER_NOT_FOUND without reading any roles', async () => {
      routeRequests(notFoundRoutes('nobody', []));

      const result = await getAccessUserRoles.execute({ user: 'nobody' }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'not-found', reason: 'USER_NOT_FOUND' });
      expect(result).not.toHaveProperty('roles');
      expect(JSON.stringify(mockedGet.mock.calls)).not.toContain('role-mappings');
    });

    it('reports NO_USER_PERMISSION when Keycloak refuses to read role mappings', async () => {
      routeRequests({ ...roleRoutes, [ROLE_MAPPINGS_KEY]: axiosError(HttpStatusCodes.FORBIDDEN) });

      const result = await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_USER_PERMISSION' });
      expect(result).not.toHaveProperty('roles');
    });

    it('reports SESSION_EXPIRED when Keycloak rejects the token', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [EXACT_USERNAME_KEY]: axiosError(HttpStatusCodes.UNAUTHORIZED) });

      const result = await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'SESSION_EXPIRED' });
    });

    it('does not read anything in Production', async () => {
      const result = await productionTools.getAccessUserRoles.execute(
        { user: USERNAME },
        contextFor(createCaller({}, PROD_HOST)),
      );

      expect(result).toMatchObject({ status: 'unavailable', reason: 'USER_INSPECTION_NOT_ALLOWED' });
      expect(result).not.toHaveProperty('roles');
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('logs and rethrows unexpected failures', async () => {
      routeRequests({ [TENANT_URL]: tenantResponse, [EXACT_USERNAME_KEY]: axiosError(HttpStatusCodes.BAD_REQUEST) });

      await expect(getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()))).rejects.toThrow(
        'Request failed',
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Access user tool 'getAccessUserRoles' failed"),
        expect.objectContaining({ user: 'caller-1' }),
      );
    });
  });

  describe('getAccessUserRoles model output', () => {
    const tenantAdministratorOutput = {
      status: 'available' as const,
      message: 'Role assignments of jdoe in realm Tenant One (realm-1) in Development (read-only).',
      environment: devEnvironment,
      realm: { ...tenantRealm, kind: 'tenant' as const },
      search: USERNAME,
      matchedBy: 'username' as const,
      user: identifyingUser,
      roles: tenantAdministratorRoles,
    };

    it('gives the model each role with where it comes from, one line per client and source', async () => {
      routeRequests(roleRoutes);
      const result = await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()));

      const { value } = getAccessUserRoles.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        [
          'roles: 2 direct, 3 inherited; groups: none',
          '- realm: default-roles-realm-1 (composite) ← direct',
          '- realm: offline_access ← via default-roles-realm-1',
          `- realm: role-test ← via tenant-admin (${TENANT_SERVICE})`,
          '- client account: view-profile ← via default-roles-realm-1',
          `- client ${TENANT_SERVICE}: tenant-admin (composite) ← direct`,
        ].join('\n'),
      );
    });

    it('tells the model when inherited roles could not be traced', async () => {
      routeRequests({ ...roleRoutes, [COMPOSITES_KEY]: axiosError(HttpStatusCodes.FORBIDDEN) });
      const result = await getAccessUserRoles.execute({ user: USERNAME }, contextFor(createCaller()));

      const { value } = getAccessUserRoles.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain('incomplete: some inherited roles could not be traced, so the list may be incomplete');
    });

    it('lists the roles a person holds the same way on one line', () => {
      const output = tenantAdministratorOutput;

      const { value } = getAccessUserRoles.toModelOutput(output) as ModelTextOutput;

      expect(value).toContain(
        `- client urn:ads:platform:form-service: form-admin, form-reader, form-writer ← via tenant-admin (${TENANT_SERVICE})`,
      );
    });

    it('keeps every source of a role held more than one way', () => {
      const output = tenantAdministratorOutput;

      const { value } = getAccessUserRoles.toModelOutput(output) as ModelTextOutput;

      expect(value).toContain(`- client ${TENANT_SERVICE}: tenant-admin (composite) ← direct | group /tenant-admins`);
    });

    it("is less than half the size of a tenant administrator's raw role assignments", () => {
      const output = tenantAdministratorOutput;

      const { value } = getAccessUserRoles.toModelOutput(output) as ModelTextOutput;

      expect(value.length).toBeLessThan(JSON.stringify(output).length / 2);
    });
  });

  describe('getAccessUserSignInStatus', () => {
    const NOW = Date.parse('2026-11-06T12:00:00Z');
    const signInRoutes = {
      ...findRoutes,
      [adminKey(`/attack-detection/brute-force/users/${USER_ID}`)]: {
        disabled: true,
        numFailures: 5,
        lastFailure: NOW - 60_000,
        failedLoginNotBefore: 0,
        lastIPFailure: '10.9.9.9',
      },
      [adminKey('')]: { bruteForceProtected: true, permanentLockout: true, smtpServer: { password: 'smtp-secret' } },
      [adminKey(`/users/${USER_ID}/credentials`)]: [{ type: 'password', secretData: 'hashed-password' }],
      [adminKey(`/users/${USER_ID}/sessions`)]: [
        { ipAddress: '10.8.8.8', start: NOW - 7_200_000, lastAccess: NOW - 3_600_000, clients: { c1: 'app-1' } },
      ],
      [adminKey('/events/config')]: { eventsEnabled: true },
      [adminKey('/events', { user: USER_ID, first: 0, max: 50 })]: [
        { type: 'LOGIN_ERROR', error: 'invalid_user_credentials', time: NOW - 60_000, ipAddress: '10.7.7.7' },
      ],
    };

    it('explains a permanent lockout in plain words without IP addresses or credential values', async () => {
      routeRequests(signInRoutes);

      const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'available',
        message:
          'Sign-in status of jdoe in realm Tenant One (realm-1) in Development (read-only). The account is locked ' +
          'after too many failed sign-ins until an administrator unlocks it.',
        user: identifyingUser,
        signIn: {
          enabled: true,
          lockout: { protectionOn: true, permanent: true, lockedOut: true, failedAttempts: 5 },
          signInMethods: { identityProviders: ['core'], password: true, otp: false },
          history: {
            recording: true,
            recentErrors: [expect.objectContaining({ step: 'Sign-in', meaning: 'The password was wrong.' })],
          },
          notes: [],
        },
      });
      const serialized = JSON.stringify(result);
      for (const value of [...PERSONAL_VALUES, '10.', 'hashed-password', 'smtp-secret']) {
        expect(serialized).not.toContain(value);
      }
    });

    it('still answers when sign-in history cannot be read, and says why', async () => {
      routeRequests({
        ...signInRoutes,
        [adminKey('/events/config')]: axiosError(HttpStatusCodes.FORBIDDEN),
        [adminKey('/events', { user: USER_ID, first: 0, max: 50 })]: axiosError(HttpStatusCodes.FORBIDDEN),
      });

      const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

      expect(result.status).toBe('available');
      expect(result.signIn.history).toBeUndefined();
      expect(result.signIn.notes).toEqual([
        'Sign-in history could not be read; reading it needs the realm-management view-events role.',
      ]);
    });

    it('does not read anything in Production', async () => {
      const result = await productionTools.getAccessUserSignInStatus.execute(
        { user: USERNAME },
        contextFor(createCaller({}, PROD_HOST)),
      );

      expect(result).toMatchObject({ status: 'unavailable', reason: 'USER_INSPECTION_NOT_ALLOWED' });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    describe('model output', () => {
      const busySignInRoutes = {
        ...signInRoutes,
        [adminKey(`/users/${USER_ID}/sessions`)]: Array.from({ length: 10 }, (_, index) => ({
          ipAddress: `10.8.8.${index}`,
          start: NOW - (index + 2) * 3_600_000,
          lastAccess: NOW - (index + 1) * 3_600_000,
          clients: { c1: 'urn:ads:demo:web-app', c2: 'account-console' },
        })),
        [adminKey('/events', { user: USER_ID, first: 0, max: 50 })]: Array.from({ length: 10 }, (_, index) => ({
          type: index < 7 ? 'LOGIN_ERROR' : 'CODE_TO_TOKEN_ERROR',
          error: index < 7 ? 'invalid_user_credentials' : 'invalid_code',
          clientId: 'urn:ads:demo:web-app',
          time: NOW - (index + 1) * 60_000,
          ipAddress: '10.7.7.7',
        })),
      };

      it.each([
        'verdict: The account is locked after too many failed sign-ins until an administrator unlocks it.',
        'account: enabled',
        'lockout: failedAttempts=5, lastFailureAt=2026-11-06 11:59Z; true: protectionOn, permanent, lockedOut',
        'required actions: none',
        'sign-in methods: identityProviders=core; true: password; false: otp, securityKey',
        'active sessions: 1 (last active 2026-11-06 11:00Z; apps: app-1)',
        'sign-in history: true: recording',
        '- 1× Sign-in: invalid_user_credentials (The password was wrong.), latest 2026-11-06 11:59Z',
      ])('gives the model the sign-in fact "%s"', async (fact) => {
        routeRequests(signInRoutes);
        const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

        const { value } = getAccessUserSignInStatus.toModelOutput(result) as ModelTextOutput;

        expect(value).toContain(fact);
      });

      it('gives the model each kind of repeated sign-in error once, with how often and when it last happened', async () => {
        routeRequests(busySignInRoutes);
        const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

        const { value } = getAccessUserSignInStatus.toModelOutput(result) as ModelTextOutput;

        expect(value).toContain(
          'recent sign-in errors by kind (2):\n' +
            '- 7× Sign-in: invalid_user_credentials (The password was wrong.), app urn:ads:demo:web-app, latest ' +
            '2026-11-06 11:59Z\n' +
            '- 3× Getting a token after sign-in: invalid_code (The app reused a sign-in code that was already used ' +
            'or had expired.), app urn:ads:demo:web-app, latest 2026-11-06 11:52Z',
        );
      });

      it('summarizes active sessions with when the person was last active and the apps they used', async () => {
        routeRequests(busySignInRoutes);
        const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

        const { value } = getAccessUserSignInStatus.toModelOutput(result) as ModelTextOutput;

        expect(value).toContain(
          'active sessions: 10 (last active 2026-11-06 11:00Z; apps: account-console, urn:ads:demo:web-app)',
        );
      });

      it('gives the model the notes on what could not be read', async () => {
        routeRequests({
          ...signInRoutes,
          [adminKey('/events/config')]: axiosError(HttpStatusCodes.FORBIDDEN),
          [adminKey('/events', { user: USER_ID, first: 0, max: 50 })]: axiosError(HttpStatusCodes.FORBIDDEN),
        });
        const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

        const { value } = getAccessUserSignInStatus.toModelOutput(result) as ModelTextOutput;

        expect(value).toContain(
          'notes: Sign-in history could not be read; reading it needs the realm-management view-events role.',
        );
      });

      it('never gives the model IP addresses or credential values', async () => {
        routeRequests(busySignInRoutes);
        const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

        const { value } = getAccessUserSignInStatus.toModelOutput(result) as ModelTextOutput;

        expect(value).not.toMatch(/10\.\d|hashed-password|smtp-secret/);
      });

      it('is less than half the size of the raw sign-in status of a busy account', async () => {
        routeRequests(busySignInRoutes);
        const result = await getAccessUserSignInStatus.execute({ user: USERNAME }, contextFor(createCaller()));

        const { value } = getAccessUserSignInStatus.toModelOutput(result) as ModelTextOutput;

        expect(value.length).toBeLessThan(JSON.stringify(result).length / 2);
      });
    });
  });

  describe('checkAccessUserForService', () => {
    const catalogRoutes = {
      [`${CATALOG_URL}?core=true`]: {
        latest: {
          configuration: {
            [TENANT_SERVICE]: {
              roles: [
                { role: 'tenant-admin', description: 'Administrator of the tenant.' },
                { role: 'platform-service', description: 'Reads tenant information.' },
              ],
            },
            'urn:ads:platform:form-service': { roles: [{ role: 'form-admin', inTenantAdmin: true }] },
          },
        },
      },
      [CATALOG_URL]: { latest: { configuration: {} } },
    };

    it('lists each role of the named service as held or missing, with how it is held', async () => {
      routeRequests({ ...roleRoutes, ...catalogRoutes });

      const result = await checkAccessUserForService.execute(
        { user: USERNAME, service: 'tenant service' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({
        status: 'available',
        message:
          'Checked jdoe against urn:ads:platform:tenant-service in realm Tenant One (realm-1) in Development ' +
          '(read-only): holds 1 of 2 service roles.',
        service: 'tenant service',
        services: [
          {
            service: TENANT_SERVICE,
            rolesFrom: 'platform',
            roles: [
              {
                role: 'platform-service',
                description: 'Reads tenant information.',
                inTenantAdmin: false,
                has: false,
                sources: [],
              },
              {
                role: 'tenant-admin',
                description: 'Administrator of the tenant.',
                inTenantAdmin: false,
                has: true,
                sources: [{ type: 'direct' }],
              },
            ],
            otherRoles: [],
          },
        ],
      });
    });

    it("also checks the app's token when an app is named", async () => {
      routeRequests({
        ...roleRoutes,
        ...catalogRoutes,
        [adminKey('/clients', { clientId: 'urn:ads:demo:app' })]: [{ id: 'c-app', clientId: 'urn:ads:demo:app' }],
        [adminKey('/clients/c-app/evaluate-scopes/generate-example-access-token', {
          scope: 'openid',
          userId: USER_ID,
        })]: { aud: ['account'], resource_access: {}, email: EMAIL },
      });

      const result = await checkAccessUserForService.execute(
        { user: USERNAME, service: 'tenant', app: 'urn:ads:demo:app' },
        contextFor(createCaller()),
      );

      expect(result.services[0].token).toEqual({ app: 'urn:ads:demo:app', audienceIncluded: false });
      expect(result.services[0].roles.map((role) => role.inToken)).toEqual([false, false]);
      expect(JSON.stringify(result)).not.toContain(EMAIL);
    });

    it('reports SERVICE_NOT_FOUND when nothing matches the service name', async () => {
      routeRequests({
        ...roleRoutes,
        ...catalogRoutes,
        [adminKey('/clients', { first: 0, max: 500 })]: [{ id: 'c-x', clientId: 'urn:ads:demo:other' }],
      });

      const result = await checkAccessUserForService.execute(
        { user: USERNAME, service: 'payments' },
        contextFor(createCaller()),
      );

      expect(result).toMatchObject({ status: 'not-found', reason: 'SERVICE_NOT_FOUND', user: identifyingUser });
      expect(result).not.toHaveProperty('services');
    });

    it('falls back to the Keycloak client roles when the role list cannot be read', async () => {
      routeRequests({
        ...roleRoutes,
        [`${CATALOG_URL}?core=true`]: axiosError(HttpStatusCodes.FORBIDDEN),
        [CATALOG_URL]: axiosError(HttpStatusCodes.FORBIDDEN),
        [adminKey('/clients', { first: 0, max: 500 })]: [{ id: 'c-tenant', clientId: TENANT_SERVICE }],
        [adminKey('/clients/c-tenant/roles', { briefRepresentation: true })]: [{ id: 't-admin', name: 'tenant-admin' }],
      });

      const result = await checkAccessUserForService.execute(
        { user: USERNAME, service: 'tenant' },
        contextFor(createCaller()),
      );

      expect(result.services).toEqual([
        expect.objectContaining({
          service: TENANT_SERVICE,
          rolesFrom: 'client',
          roles: [{ role: 'tenant-admin', has: true, sources: [{ type: 'direct' }] }],
        }),
      ]);
      expect(result.notes).toEqual([expect.stringContaining('could not be read')]);
    });

    it('gives the model each role of the service as held, with how, or missing', async () => {
      routeRequests({ ...roleRoutes, ...catalogRoutes });
      const result = await checkAccessUserForService.execute(
        { user: USERNAME, service: 'tenant service' },
        contextFor(createCaller()),
      );

      const { value } = checkAccessUserForService.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        'service asked for: "tenant service"\n' +
          `service ${TENANT_SERVICE} (roles from platform)\n` +
          'service roles (2):\n' +
          '- platform-service: missing, not a tenant-admin default — Reads tenant information.\n' +
          '- tenant-admin: has ← direct, not a tenant-admin default — Administrator of the tenant.',
      );
    });

    it("gives the model whether the service's audience and roles are in the app's token", async () => {
      routeRequests({
        ...roleRoutes,
        ...catalogRoutes,
        [adminKey('/clients', { clientId: 'urn:ads:demo:app' })]: [{ id: 'c-app', clientId: 'urn:ads:demo:app' }],
        [adminKey('/clients/c-app/evaluate-scopes/generate-example-access-token', {
          scope: 'openid',
          userId: USER_ID,
        })]: { aud: ['account'], resource_access: {} },
      });
      const result = await checkAccessUserForService.execute(
        { user: USERNAME, service: 'tenant', app: 'urn:ads:demo:app' },
        contextFor(createCaller()),
      );

      const { value } = checkAccessUserForService.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        'token from urn:ads:demo:app: audience not included\n' +
          'service roles (2):\n' +
          '- platform-service: missing, not a tenant-admin default, not in token — Reads tenant information.\n' +
          '- tenant-admin: has ← direct, not a tenant-admin default, not in token — Administrator of the tenant.',
      );
    });
  });

  describe('compareAccessUsers', () => {
    const SAM_ID = 'user-id-2';
    const sam = { id: SAM_ID, username: 'sam', enabled: true, requiredActions: [], federatedIdentities: [] };
    const compareRoutes = {
      ...roleRoutes,
      [adminKey('/users', { username: 'sam', exact: true, briefRepresentation: true })]: [sam],
      [adminKey(`/users/${SAM_ID}`)]: sam,
      [adminKey(`/users/${SAM_ID}/role-mappings`)]: { realmMappings: [defaultRoles] },
      [adminKey(`/users/${SAM_ID}/groups`, { briefRepresentation: true })]: [],
      [adminKey(`/users/${SAM_ID}/role-mappings/realm/composite`)]: [defaultRoles, offlineAccess],
    };

    it('lists only the roles one of them has', async () => {
      routeRequests(compareRoutes);

      const result = await compareAccessUsers.execute({ first: USERNAME, second: 'sam' }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'available',
        first: { search: USERNAME, matchedBy: 'username', user: identifyingUser },
        second: { search: 'sam', matchedBy: 'username', user: { username: 'sam' } },
        comparison: {
          onlyFirst: [
            { name: 'role-test', sources: [expect.objectContaining({ type: 'composite' })] },
            { name: 'tenant-admin', client: TENANT_SERVICE, sources: [{ type: 'direct' }] },
          ],
          onlySecond: [],
          sharedCount: 3,
        },
      });
    });

    it('reports which person could not be found, with choices', async () => {
      routeRequests({
        ...compareRoutes,
        ...notFoundRoutes('al', [
          { id: 'a1', username: 'alice' },
          { id: 'a2', username: 'alan' },
        ]),
      });

      const result = await compareAccessUsers.execute({ first: 'al', second: 'sam' }, contextFor(createCaller()));

      expect(result).toMatchObject({
        status: 'not-found',
        reason: 'USER_AMBIGUOUS',
        first: { search: 'al', suggestions: ['alice', 'alan'] },
        second: { search: 'sam', user: { username: 'sam' } },
      });
      expect(result).not.toHaveProperty('comparison');
    });

    it('gives the model both people and the roles only one of them has, with how they are held', async () => {
      routeRequests(compareRoutes);
      const result = await compareAccessUsers.execute({ first: USERNAME, second: 'sam' }, contextFor(createCaller()));

      const { value } = compareAccessUsers.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain(
        [
          'first: jdoe (id user-id-1, matched by username): enabled; email verified; required actions: none; ' +
            'identity providers: core',
          'second: sam (id user-id-2, matched by username): enabled; required actions: none; identity providers: none',
          'roles only first has (2):',
          `- realm: role-test ← via tenant-admin (${TENANT_SERVICE})`,
          `- client ${TENANT_SERVICE}: tenant-admin ← direct`,
          'roles only second has: none',
          'shared roles: 3',
          'groups only first is in: none',
          'groups only second is in: none',
        ].join('\n'),
      );
    });

    it('gives the model the usernames to choose from for the person who could not be found', async () => {
      routeRequests({
        ...compareRoutes,
        ...notFoundRoutes('al', [
          { id: 'a1', username: 'alice' },
          { id: 'a2', username: 'alan' },
        ]),
      });
      const result = await compareAccessUsers.execute({ first: 'al', second: 'sam' }, contextFor(createCaller()));

      const { value } = compareAccessUsers.toModelOutput(result) as ModelTextOutput;

      expect(value).toContain('first searched for: "al"\nsuggestions: alice, alan\nsecond: sam');
    });

    it('does not read anything in Production', async () => {
      const result = await productionTools.compareAccessUsers.execute(
        { first: USERNAME, second: 'sam' },
        contextFor(createCaller({}, PROD_HOST)),
      );

      expect(result).toMatchObject({ status: 'unavailable', reason: 'USER_INSPECTION_NOT_ALLOWED' });
      expect(mockedGet).not.toHaveBeenCalled();
    });
  });
});
