import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { createRealmClient, mapRequestError } from './realmClient';
import { ACCESS_DISCOVERY_MESSAGES } from './types';

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

const tenantId = { toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1' };
const user = { id: 'user-1', tenantId, token: { bearer: 'user-token' } } as unknown as User;
const directory = {
  getResourceUrl: jest.fn().mockResolvedValue(new URL('https://tenant-service.test/api/tenant/v2/tenants/tenant-1')),
};

describe('mapRequestError', () => {
  it.each([
    [401, 'unavailable', 'SESSION_EXPIRED'],
    [403, 'unavailable', 'NO_PERMISSION'],
    [404, 'not-found', 'REALM_NOT_FOUND'],
    [500, 'unreachable', 'ENVIRONMENT_UNREACHABLE'],
    [503, 'unreachable', 'ENVIRONMENT_UNREACHABLE'],
  ])('maps HTTP %s to %s / %s', (status, expectedStatus, reason) => {
    expect(mapRequestError(axiosError(status))).toEqual({
      status: expectedStatus,
      reason,
      message: ACCESS_DISCOVERY_MESSAGES[reason],
    });
  });

  it('maps a timeout or network failure to ENVIRONMENT_UNREACHABLE', () => {
    expect(mapRequestError(axiosError())).toMatchObject({ status: 'unreachable', reason: 'ENVIRONMENT_UNREACHABLE' });
  });

  it('rethrows unexpected HTTP failures', () => {
    const error = axiosError(400);
    expect(() => mapRequestError(error)).toThrow(error);
  });

  it('rethrows non-HTTP errors', () => {
    const error = new Error('bug');
    expect(() => mapRequestError(error)).toThrow(error);
  });
});

describe('createRealmClient', () => {
  const client = createRealmClient({ directory: directory as never });

  beforeEach(() => {
    mockedGet.mockReset();
    directory.getResourceUrl.mockClear();
  });

  describe('getTenantRealm', () => {
    it("reads the user's own tenant with the user's token", async () => {
      mockedGet.mockResolvedValueOnce({
        data: {
          id: 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1',
          realm: 'realm-1',
          name: 'Tenant One',
          status: 'active',
          adminEmail: 'admin@example.com',
        },
      });

      const result = await client.getTenantRealm(user);

      expect(directory.getResourceUrl).toHaveBeenCalledWith(tenantId);
      expect(mockedGet).toHaveBeenCalledWith('https://tenant-service.test/api/tenant/v2/tenants/tenant-1', {
        headers: { Authorization: 'Bearer user-token' },
        timeout: 5000,
      });
      expect(result).toEqual({
        ok: true,
        value: { realm: 'realm-1', name: 'Tenant One', kind: 'tenant', status: 'active' },
      });
      expect(JSON.stringify(result)).not.toContain('admin@example.com');
    });

    it('falls back to the realm when the tenant has no name', async () => {
      mockedGet.mockResolvedValueOnce({ data: { realm: 'realm-1' } });

      await expect(client.getTenantRealm(user)).resolves.toEqual({
        ok: true,
        value: { realm: 'realm-1', name: 'realm-1', kind: 'tenant', status: undefined },
      });
    });

    it('reports REALM_MISMATCH when the tenant has no realm', async () => {
      mockedGet.mockResolvedValueOnce({ data: { name: 'Tenant One' } });

      await expect(client.getTenantRealm(user)).resolves.toMatchObject({
        ok: false,
        problem: { status: 'unavailable', reason: 'REALM_MISMATCH' },
      });
    });

    it('reports NO_PERMISSION when tenant-service refuses the user', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(403));

      await expect(client.getTenantRealm(user)).resolves.toMatchObject({
        ok: false,
        problem: { status: 'unavailable', reason: 'NO_PERMISSION' },
      });
    });
  });

  describe('getRealmOpenIdConfiguration', () => {
    it('reads the public configuration without credentials and keeps only identifying fields', async () => {
      mockedGet.mockResolvedValueOnce({
        data: {
          issuer: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1',
          authorization_endpoint: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/auth',
          token_endpoint: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/token',
          userinfo_endpoint: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/userinfo',
          end_session_endpoint: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/logout',
          jwks_uri: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/certs',
          grant_types_supported: ['authorization_code'],
        },
      });

      const result = await client.getRealmOpenIdConfiguration('https://access.adsp-dev.gov.ab.ca', 'realm-1');

      expect(mockedGet).toHaveBeenCalledWith(
        'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/.well-known/openid-configuration',
        { headers: { Accept: 'application/json' }, timeout: 5000 },
      );
      expect(result).toEqual({
        ok: true,
        value: {
          issuer: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1',
          endpoints: {
            authorization: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/auth',
            token: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/token',
            userInfo: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/userinfo',
            endSession: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/logout',
            jwks: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/protocol/openid-connect/certs',
          },
        },
      });
    });

    it('encodes the realm into the path', async () => {
      mockedGet.mockResolvedValueOnce({ data: { issuer: 'issuer' } });

      await client.getRealmOpenIdConfiguration('https://access.adsp-dev.gov.ab.ca', '../admin');

      expect(mockedGet.mock.calls[0][0]).toBe(
        'https://access.adsp-dev.gov.ab.ca/auth/realms/..%2Fadmin/.well-known/openid-configuration',
      );
    });

    it('reports REALM_NOT_FOUND when Keycloak has no such realm', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(404));

      await expect(
        client.getRealmOpenIdConfiguration('https://access.adsp-dev.gov.ab.ca', 'missing'),
      ).resolves.toMatchObject({ ok: false, problem: { status: 'not-found', reason: 'REALM_NOT_FOUND' } });
    });

    it('reports ENVIRONMENT_UNREACHABLE when Keycloak does not respond', async () => {
      mockedGet.mockRejectedValueOnce(axiosError());

      await expect(
        client.getRealmOpenIdConfiguration('https://access.adsp-dev.gov.ab.ca', 'realm-1'),
      ).resolves.toMatchObject({ ok: false, problem: { status: 'unreachable', reason: 'ENVIRONMENT_UNREACHABLE' } });
    });

    it('reports ENVIRONMENT_UNREACHABLE when the response has no issuer', async () => {
      mockedGet.mockResolvedValueOnce({ data: '<html>proxy error</html>' });

      await expect(
        client.getRealmOpenIdConfiguration('https://access.adsp-dev.gov.ab.ca', 'realm-1'),
      ).resolves.toMatchObject({ ok: false, problem: { reason: 'ENVIRONMENT_UNREACHABLE' } });
    });
  });
});
