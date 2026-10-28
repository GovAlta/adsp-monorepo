import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { createClientReader } from './clientReader';

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

const HOST = 'https://access.adsp-dev.gov.ab.ca';
const ADMIN_URL = `${HOST}/auth/admin/realms/realm-1`;
const user = { id: 'user-1', token: { bearer: 'user-token' } } as unknown as User;
const target = { host: HOST, realm: 'realm-1', user };
const requestOptions = {
  headers: { Authorization: 'Bearer user-token', Accept: 'application/json' },
  timeout: 5000,
};

describe('createClientReader', () => {
  const reader = createClientReader();

  beforeEach(() => {
    mockedGet.mockReset();
  });

  describe('listClients', () => {
    it("lists the realm's clients with the user's token", async () => {
      mockedGet.mockResolvedValueOnce({ data: [{ clientId: 'app-1' }, { clientId: 'app-2' }] });

      const result = await reader.listClients(target, { max: 101 });

      expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}/clients`, {
        ...requestOptions,
        params: { first: 0, max: 101 },
      });
      expect(result).toEqual({ ok: true, value: [{ clientId: 'app-1' }, { clientId: 'app-2' }] });
    });

    it('searches client IDs containing the search text', async () => {
      mockedGet.mockResolvedValueOnce({ data: [] });

      await reader.listClients(target, { search: 'web app', max: 5 });

      expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}/clients`, {
        ...requestOptions,
        params: { clientId: 'web app', search: true, first: 0, max: 5 },
      });
    });

    it('encodes the realm into the path', async () => {
      mockedGet.mockResolvedValueOnce({ data: [] });

      await reader.listClients({ ...target, realm: '../master' }, { max: 1 });

      expect(mockedGet.mock.calls[0][0]).toBe(`${HOST}/auth/admin/realms/..%2Fmaster/clients`);
    });

    it.each([
      [HttpStatusCodes.UNAUTHORIZED, 'unavailable', 'SESSION_EXPIRED'],
      [HttpStatusCodes.FORBIDDEN, 'unavailable', 'NO_CLIENT_PERMISSION'],
      [HttpStatusCodes.NOT_FOUND, 'not-found', 'REALM_NOT_FOUND'],
      [HttpStatusCodes.BAD_GATEWAY, 'unreachable', 'ENVIRONMENT_UNREACHABLE'],
    ])('maps HTTP %s to %s / %s', async (status, expectedStatus, reason) => {
      mockedGet.mockRejectedValueOnce(axiosError(status));

      await expect(reader.listClients(target, { max: 1 })).resolves.toMatchObject({
        ok: false,
        problem: { status: expectedStatus, reason },
      });
    });

    it('reports ENVIRONMENT_UNREACHABLE when Keycloak does not respond', async () => {
      mockedGet.mockRejectedValueOnce(axiosError());

      await expect(reader.listClients(target, { max: 1 })).resolves.toMatchObject({
        ok: false,
        problem: { reason: 'ENVIRONMENT_UNREACHABLE' },
      });
    });

    it('reports ENVIRONMENT_UNREACHABLE when the response is not a client list', async () => {
      mockedGet.mockResolvedValueOnce({ data: '<html>proxy error</html>' });

      await expect(reader.listClients(target, { max: 1 })).resolves.toMatchObject({
        ok: false,
        problem: { status: 'unreachable', reason: 'ENVIRONMENT_UNREACHABLE' },
      });
    });

    it('rethrows unexpected failures', async () => {
      const error = axiosError(HttpStatusCodes.BAD_REQUEST);
      mockedGet.mockRejectedValueOnce(error);

      await expect(reader.listClients(target, { max: 1 })).rejects.toBe(error);
    });
  });

  describe('findClientInternalId', () => {
    it('looks up the exact client ID and returns its internal ID', async () => {
      mockedGet.mockResolvedValueOnce({ data: [{ id: 'internal-1', clientId: 'urn:ads:tenant:demo:app' }] });

      const result = await reader.findClientInternalId(target, 'urn:ads:tenant:demo:app');

      expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}/clients`, {
        ...requestOptions,
        params: { clientId: 'urn:ads:tenant:demo:app' },
      });
      expect(result).toEqual({ ok: true, value: 'internal-1' });
    });

    it('ignores clients whose client ID is not an exact match', async () => {
      mockedGet.mockResolvedValueOnce({ data: [{ id: 'internal-1', clientId: 'urn:ads:tenant:demo:app-2' }] });

      await expect(reader.findClientInternalId(target, 'urn:ads:tenant:demo:app')).resolves.toEqual({
        ok: true,
        value: undefined,
      });
    });

    it('accepts the client Keycloak matched regardless of case', async () => {
      mockedGet.mockResolvedValueOnce({ data: [{ id: 'internal-1', clientId: 'urn:ads:platform:tenant-admin-app' }] });

      await expect(reader.findClientInternalId(target, 'URN:ADS:PLATFORM:TENANT-ADMIN-APP')).resolves.toEqual({
        ok: true,
        value: 'internal-1',
      });
    });

    it('prefers the client whose client ID matches exactly, including case', async () => {
      mockedGet.mockResolvedValueOnce({
        data: [
          { id: 'internal-lower', clientId: 'my-app' },
          { id: 'internal-upper', clientId: 'MY-APP' },
        ],
      });

      await expect(reader.findClientInternalId(target, 'MY-APP')).resolves.toEqual({
        ok: true,
        value: 'internal-upper',
      });
    });

    it('resolves to undefined when there is no such client', async () => {
      mockedGet.mockResolvedValueOnce({ data: [] });

      await expect(reader.findClientInternalId(target, 'missing')).resolves.toEqual({ ok: true, value: undefined });
    });

    it('reports NO_CLIENT_PERMISSION when Keycloak refuses the user', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(HttpStatusCodes.FORBIDDEN));

      await expect(reader.findClientInternalId(target, 'app')).resolves.toMatchObject({
        ok: false,
        problem: { reason: 'NO_CLIENT_PERMISSION' },
      });
    });
  });

  describe('getClientConfiguration', () => {
    const client = { id: 'internal/1', clientId: 'app' };
    const roles = [{ name: 'reader' }];
    const scopeMappings = { realmMappings: [] };

    function respondWith(responses: Record<string, unknown>) {
      mockedGet.mockImplementation(async (url: string) => {
        if (!(url in responses)) {
          throw new Error(`Unexpected URL ${url}`);
        }
        const response = responses[url];
        if (response instanceof Error) {
          throw response;
        }
        return { data: response };
      });
    }

    const clientUrl = `${ADMIN_URL}/clients/internal%2F1`;

    it("reads the client, its roles and its scope mappings with GET only and the user's token", async () => {
      const post = jest.spyOn(axios, 'post');
      respondWith({
        [clientUrl]: client,
        [`${clientUrl}/roles`]: roles,
        [`${clientUrl}/scope-mappings`]: scopeMappings,
      });

      const result = await reader.getClientConfiguration(target, 'internal/1');

      expect(result).toEqual({ ok: true, value: { client, roles, scopeMappings } });
      expect(mockedGet).toHaveBeenCalledTimes(3);
      for (const [, options] of mockedGet.mock.calls) {
        expect(options).toEqual({ ...requestOptions, params: undefined });
      }
      expect(post).not.toHaveBeenCalled();
    });

    it('reports CLIENT_NOT_FOUND when the client no longer exists', async () => {
      respondWith({
        [clientUrl]: axiosError(HttpStatusCodes.NOT_FOUND),
        [`${clientUrl}/roles`]: axiosError(HttpStatusCodes.NOT_FOUND),
        [`${clientUrl}/scope-mappings`]: axiosError(HttpStatusCodes.NOT_FOUND),
      });

      await expect(reader.getClientConfiguration(target, 'internal/1')).resolves.toMatchObject({
        ok: false,
        problem: { status: 'not-found', reason: 'CLIENT_NOT_FOUND' },
      });
    });

    it('reports a problem reading the roles', async () => {
      respondWith({
        [clientUrl]: client,
        [`${clientUrl}/roles`]: axiosError(HttpStatusCodes.FORBIDDEN),
        [`${clientUrl}/scope-mappings`]: scopeMappings,
      });

      await expect(reader.getClientConfiguration(target, 'internal/1')).resolves.toMatchObject({
        ok: false,
        problem: { reason: 'NO_CLIENT_PERMISSION' },
      });
    });

    it('reports a problem reading the scope mappings', async () => {
      respondWith({
        [clientUrl]: client,
        [`${clientUrl}/roles`]: roles,
        [`${clientUrl}/scope-mappings`]: axiosError(),
      });

      await expect(reader.getClientConfiguration(target, 'internal/1')).resolves.toMatchObject({
        ok: false,
        problem: { reason: 'ENVIRONMENT_UNREACHABLE' },
      });
    });

    it('reports ENVIRONMENT_UNREACHABLE when the client response is not an object', async () => {
      respondWith({
        [clientUrl]: [client],
        [`${clientUrl}/roles`]: roles,
        [`${clientUrl}/scope-mappings`]: scopeMappings,
      });

      await expect(reader.getClientConfiguration(target, 'internal/1')).resolves.toMatchObject({
        ok: false,
        problem: { reason: 'ENVIRONMENT_UNREACHABLE' },
      });
    });
  });
});
