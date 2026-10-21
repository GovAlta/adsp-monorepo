import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { createAccessDiscoveryTools } from './accessDiscovery';

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
const AGENT_USER_ROLE = 'urn:ads:platform:agent-service:agent-user';
const tenantId = { toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1' };

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const directory = {
  getResourceUrl: jest.fn().mockResolvedValue(new URL('https://tenant-service.test/api/tenant/v2/tenants/tenant-1')),
};

function createUser(overrides: Partial<User> = {}, realm = 'realm-1'): User {
  return {
    id: 'user-1',
    name: 'Tester',
    email: 'tester@example.com',
    roles: [AGENT_USER_ROLE],
    tenantId,
    isCore: false,
    token: { iss: `${DEV_HOST}/auth/realms/${realm}`, bearer: 'user-token' },
    ...overrides,
  } as unknown as User;
}

function contextFor(user?: User) {
  const values = { user, tenantId };
  return { requestContext: { get: (key: string) => values[key] } } as never;
}

const tenantResponse = {
  data: {
    id: 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1',
    realm: 'realm-1',
    name: 'Tenant One',
    status: 'active',
    adminEmail: 'admin@example.com',
  },
};

const openIdResponse = {
  data: {
    issuer: `${DEV_HOST}/auth/realms/realm-1`,
    authorization_endpoint: `${DEV_HOST}/auth/realms/realm-1/protocol/openid-connect/auth`,
    token_endpoint: `${DEV_HOST}/auth/realms/realm-1/protocol/openid-connect/token`,
    jwks_uri: `${DEV_HOST}/auth/realms/realm-1/protocol/openid-connect/certs`,
    grant_types_supported: ['authorization_code'],
  },
};

const devEnvironment = { id: 'dev', label: 'Development', host: DEV_HOST, readOnly: true };

describe('createAccessDiscoveryTools', () => {
  const { listAccessEnvironments, listAccessRealms, getAccessRealmInfo } = createAccessDiscoveryTools({
    logger: logger as never,
    directory: directory as never,
    accessServiceUrl: new URL(DEV_HOST),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockReset();
  });

  it('uses the tool name as the tool ID', () => {
    expect(listAccessEnvironments.id).toBe('listAccessEnvironments');
    expect(listAccessRealms.id).toBe('listAccessRealms');
    expect(getAccessRealmInfo.id).toBe('getAccessRealmInfo');
  });

  describe('listAccessEnvironments', () => {
    it('lists all environments and marks only the signed-in one as inspectable', async () => {
      const result = await listAccessEnvironments.execute({}, contextFor(createUser()));

      expect(result).toEqual({
        status: 'available',
        message:
          'This session is signed in to Development, so Development can be inspected (read-only). UAT, Production cannot be inspected from this session.',
        environments: [
          { ...devEnvironment, current: true, inspectable: true },
          {
            id: 'uat',
            label: 'UAT',
            host: 'https://access-uat.alberta.ca',
            readOnly: true,
            current: false,
            inspectable: false,
          },
          {
            id: 'prod',
            label: 'Production',
            host: 'https://access.alberta.ca',
            readOnly: true,
            current: false,
            inspectable: false,
          },
        ],
      });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('still lists environments, with none inspectable, when the user lacks the role', async () => {
      const result = await listAccessEnvironments.execute({}, contextFor(createUser({ roles: [] })));

      expect(result).toMatchObject({
        status: 'unavailable',
        reason: 'MISSING_ROLE',
        missingRoles: [AGENT_USER_ROLE],
      });
      expect(result.environments.map(({ id }) => id)).toEqual(['dev', 'uat', 'prod']);
      expect(result.environments.every(({ inspectable }) => !inspectable)).toBe(true);
      expect(result.environments.find(({ current }) => current)?.id).toBe('dev');
    });
  });

  describe('listAccessRealms', () => {
    it("returns only the tenant user's own realm without the admin email", async () => {
      mockedGet.mockResolvedValueOnce(tenantResponse);

      const result = await listAccessRealms.execute({}, contextFor(createUser()));

      expect(result).toEqual({
        status: 'available',
        message: 'You can inspect 1 realm in Development (read-only): Tenant One (realm-1).',
        environment: devEnvironment,
        realms: [{ realm: 'realm-1', name: 'Tenant One', kind: 'tenant', status: 'active' }],
      });
      expect(mockedGet).toHaveBeenCalledWith(expect.any(String), {
        headers: { Authorization: 'Bearer user-token' },
        timeout: 5000,
      });
      expect(JSON.stringify(result)).not.toContain('admin@example.com');
    });

    it('ignores any realm the model tries to pass in', async () => {
      mockedGet.mockResolvedValueOnce(tenantResponse);

      const result = await listAccessRealms.execute({ realm: 'other-realm' } as never, contextFor(createUser()));

      expect(result.realms).toEqual([expect.objectContaining({ realm: 'realm-1' })]);
      expect(JSON.stringify(mockedGet.mock.calls)).not.toContain('other-realm');
    });

    it('returns the core realm for a core user without calling tenant-service', async () => {
      const user = createUser({ isCore: true, tenantId: undefined }, 'core');

      const result = await listAccessRealms.execute({}, contextFor(user));

      expect(result).toMatchObject({ status: 'available', realms: [{ realm: 'core', name: 'Core', kind: 'core' }] });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('reports REALM_MISMATCH when tenant-service returns a different realm', async () => {
      mockedGet.mockResolvedValueOnce({ data: { ...tenantResponse.data, realm: 'realm-2' } });

      const result = await listAccessRealms.execute({}, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'REALM_MISMATCH', realms: [] });
    });

    it('reports NO_PERMISSION, rather than failing, when tenant-service returns 403', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(403));

      const result = await listAccessRealms.execute({}, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_PERMISSION', realms: [] });
    });

    it('reports the missing role without calling any API', async () => {
      const result = await listAccessRealms.execute({}, contextFor(createUser({ roles: [] })));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'MISSING_ROLE', realms: [] });
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('reports NO_SESSION when there is no user', async () => {
      const result = await listAccessRealms.execute({}, contextFor(undefined));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'NO_SESSION', realms: [] });
      expect(mockedGet).not.toHaveBeenCalled();
    });
  });

  describe('getAccessRealmInfo', () => {
    it('returns basic identifying information for the realm', async () => {
      mockedGet.mockResolvedValueOnce(tenantResponse).mockResolvedValueOnce(openIdResponse);

      const result = await getAccessRealmInfo.execute({}, contextFor(createUser()));

      expect(result).toEqual({
        status: 'available',
        message: 'Realm Tenant One (realm-1) in Development is reachable and can be inspected (read-only).',
        environment: devEnvironment,
        realm: {
          realm: 'realm-1',
          name: 'Tenant One',
          kind: 'tenant',
          status: 'active',
          issuer: `${DEV_HOST}/auth/realms/realm-1`,
          endpoints: {
            authorization: `${DEV_HOST}/auth/realms/realm-1/protocol/openid-connect/auth`,
            token: `${DEV_HOST}/auth/realms/realm-1/protocol/openid-connect/token`,
            userInfo: undefined,
            endSession: undefined,
            jwks: `${DEV_HOST}/auth/realms/realm-1/protocol/openid-connect/certs`,
          },
        },
      });
      expect(mockedGet).toHaveBeenNthCalledWith(2, `${DEV_HOST}/auth/realms/realm-1/.well-known/openid-configuration`, {
        headers: { Accept: 'application/json' },
        timeout: 5000,
      });
    });

    it('only uses GET requests and never exposes the token or personal details', async () => {
      const post = jest.spyOn(axios, 'post');
      mockedGet.mockResolvedValueOnce(tenantResponse).mockResolvedValueOnce(openIdResponse);

      const result = await getAccessRealmInfo.execute({}, contextFor(createUser()));
      const serialized = JSON.stringify(result);

      expect(post).not.toHaveBeenCalled();
      expect(serialized).not.toContain('user-token');
      expect(serialized).not.toContain('admin@example.com');
      expect(serialized).not.toContain('tester@example.com');
      expect(serialized).not.toContain('grant_types_supported');
    });

    it('reports REALM_NOT_FOUND, rather than inventing details, when Keycloak returns 404', async () => {
      mockedGet.mockResolvedValueOnce(tenantResponse).mockRejectedValueOnce(axiosError(404));

      const result = await getAccessRealmInfo.execute({}, contextFor(createUser()));

      expect(result).toEqual({
        status: 'not-found',
        reason: 'REALM_NOT_FOUND',
        message: 'The realm could not be found or you do not have access to it.',
        environment: devEnvironment,
      });
    });

    it('reports ENVIRONMENT_UNREACHABLE when Keycloak does not respond', async () => {
      mockedGet.mockResolvedValueOnce(tenantResponse).mockRejectedValueOnce(axiosError());

      const result = await getAccessRealmInfo.execute({}, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unreachable', reason: 'ENVIRONMENT_UNREACHABLE' });
    });

    it('reports SESSION_EXPIRED when tenant-service rejects the token', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(401));

      const result = await getAccessRealmInfo.execute({}, contextFor(createUser()));

      expect(result).toMatchObject({ status: 'unavailable', reason: 'SESSION_EXPIRED' });
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('reads the core realm directly for a core user', async () => {
      mockedGet.mockResolvedValueOnce({ data: { issuer: `${DEV_HOST}/auth/realms/core` } });

      const result = await getAccessRealmInfo.execute(
        {},
        contextFor(createUser({ isCore: true, tenantId: undefined }, 'core')),
      );

      expect(result).toMatchObject({ status: 'available', realm: { realm: 'core', kind: 'core' } });
      expect(mockedGet).toHaveBeenCalledTimes(1);
      expect(mockedGet.mock.calls[0][0]).toBe(`${DEV_HOST}/auth/realms/core/.well-known/openid-configuration`);
    });

    it('logs and rethrows unexpected failures', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(400));

      await expect(getAccessRealmInfo.execute({}, contextFor(createUser()))).rejects.toThrow('Request failed');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Access discovery tool 'getAccessRealmInfo' failed"),
        expect.objectContaining({ user: 'user-1' }),
      );
    });
  });

  it('logs results without the token or personal details', async () => {
    await listAccessEnvironments.execute({}, contextFor(createUser()));

    expect(logger.info).toHaveBeenCalledWith(
      "Access discovery tool 'listAccessEnvironments' completed with status 'available'.",
      expect.objectContaining({ user: 'user-1', tenant: tenantId.toString() }),
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('user-token');
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('tester@example.com');
  });
});
