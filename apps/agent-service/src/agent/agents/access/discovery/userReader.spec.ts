import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { createUserReader } from './userReader';

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
const user = { id: 'caller', token: { bearer: 'user-token' } } as unknown as User;
const target = { host: HOST, realm: 'realm-1', user };
const requestOptions = {
  headers: { Authorization: 'Bearer user-token', Accept: 'application/json' },
  timeout: 5000,
};

describe('createUserReader', () => {
  const reader = createUserReader();

  beforeEach(() => {
    mockedGet.mockReset();
  });

  describe('findUserId', () => {
    it("finds the user by exact username with the user's token", async () => {
      mockedGet.mockResolvedValueOnce({ data: [{ id: 'id-1', username: 'jane.doe@gov.ab.ca' }] });

      const result = await reader.findUserId(target, 'jane.doe@gov.ab.ca');

      expect(result).toEqual({ ok: true, value: { id: 'id-1', field: 'username' } });
      expect(mockedGet).toHaveBeenCalledTimes(1);
      expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}/users`, {
        ...requestOptions,
        params: { username: 'jane.doe@gov.ab.ca', exact: true, briefRepresentation: true },
      });
    });

    it('matches regardless of case, as Keycloak does', async () => {
      mockedGet.mockResolvedValueOnce({ data: [{ id: 'id-1', username: 'jane.doe' }] });

      expect(await reader.findUserId(target, 'Jane.Doe')).toEqual({
        ok: true,
        value: { id: 'id-1', field: 'username' },
      });
    });

    it('falls back to an exact email match when no username matches', async () => {
      mockedGet
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [{ id: 'id-2', username: 'jdoe', email: 'Jane@Example.com' }] });

      const result = await reader.findUserId(target, 'jane@example.com');

      expect(result).toEqual({ ok: true, value: { id: 'id-2', field: 'email' } });
      expect(mockedGet).toHaveBeenLastCalledWith(`${ADMIN_URL}/users`, {
        ...requestOptions,
        params: { email: 'jane@example.com', exact: true, briefRepresentation: true },
      });
    });

    it('resolves to undefined when neither the username nor the email matches exactly', async () => {
      mockedGet.mockResolvedValueOnce({ data: [{ id: 'id-3', username: 'jane.doe2' }] }).mockResolvedValueOnce({
        data: [],
      });

      expect(await reader.findUserId(target, 'jane.doe')).toEqual({ ok: true, value: undefined });
    });

    it.each([
      [HttpStatusCodes.UNAUTHORIZED, 'unavailable', 'SESSION_EXPIRED'],
      [HttpStatusCodes.FORBIDDEN, 'unavailable', 'NO_USER_PERMISSION'],
      [HttpStatusCodes.NOT_FOUND, 'not-found', 'USER_NOT_FOUND'],
      [HttpStatusCodes.BAD_GATEWAY, 'unreachable', 'ENVIRONMENT_UNREACHABLE'],
    ])('maps HTTP %s to %s / %s', async (status, expectedStatus, reason) => {
      mockedGet.mockRejectedValueOnce(axiosError(status));

      const result = await reader.findUserId(target, 'jane.doe');

      expect(result).toMatchObject({ ok: false, problem: { status: expectedStatus, reason } });
    });

    it('treats a response that is not a user list as unreachable', async () => {
      mockedGet.mockResolvedValueOnce({ data: '<html>proxy error</html>' });

      expect(await reader.findUserId(target, 'jane.doe')).toMatchObject({
        ok: false,
        problem: { status: 'unreachable', reason: 'ENVIRONMENT_UNREACHABLE' },
      });
    });
  });

  it('searches users for close matches with a limit', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    await reader.searchUsers(target, 'jane', 6);

    expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}/users`, {
      ...requestOptions,
      params: { search: 'jane', first: 0, max: 6, briefRepresentation: true },
    });
  });

  it.each([
    ['getUser', () => reader.getUser(target, 'a/b'), `${ADMIN_URL}/users/a%2Fb`],
    ['getUserRoleMappings', () => reader.getUserRoleMappings(target, 'id-1'), `${ADMIN_URL}/users/id-1/role-mappings`],
    [
      'getEffectiveRealmRoles',
      () => reader.getEffectiveRealmRoles(target, 'id-1'),
      `${ADMIN_URL}/users/id-1/role-mappings/realm/composite`,
    ],
    ['getGroupRoleMappings', () => reader.getGroupRoleMappings(target, 'g-1'), `${ADMIN_URL}/groups/g-1/role-mappings`],
    ['getRoleComposites', () => reader.getRoleComposites(target, 'r-1'), `${ADMIN_URL}/roles-by-id/r-1/composites`],
    ['getClient', () => reader.getClient(target, 'c-1'), `${ADMIN_URL}/clients/c-1`],
  ])('%s reads the encoded path', async (_name, read, url) => {
    mockedGet.mockResolvedValueOnce({ data: url.endsWith('composite') || url.endsWith('composites') ? [] : {} });

    const result = await read();

    expect(result.ok).toBe(true);
    expect(mockedGet).toHaveBeenCalledWith(url, { ...requestOptions, params: undefined });
  });

  it("reads the user's groups", async () => {
    mockedGet.mockResolvedValueOnce({ data: [{ id: 'g-1', path: '/admins' }] });

    expect(await reader.getUserGroups(target, 'id-1')).toEqual({ ok: true, value: [{ id: 'g-1', path: '/admins' }] });
    expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}/users/id-1/groups`, {
      ...requestOptions,
      params: { briefRepresentation: true },
    });
  });

  it('reports USER_NOT_FOUND when the user no longer exists', async () => {
    mockedGet.mockRejectedValueOnce(axiosError(HttpStatusCodes.NOT_FOUND));

    expect(await reader.getUser(target, 'missing')).toMatchObject({
      ok: false,
      problem: { status: 'not-found', reason: 'USER_NOT_FOUND' },
    });
  });

  it('encodes each segment of a group path', async () => {
    mockedGet.mockResolvedValueOnce({ data: { id: 'g-1' } });

    await reader.getGroupByPath(target, '/tenant admins/reviewers & leads');

    expect(mockedGet.mock.calls[0][0]).toBe(`${ADMIN_URL}/group-by-path/tenant%20admins/reviewers%20%26%20leads`);
  });

  it('rethrows unexpected failures', async () => {
    mockedGet.mockRejectedValueOnce(new TypeError('boom'));

    await expect(reader.getUser(target, 'id-1')).rejects.toThrow('boom');
  });

  describe('sign-in reads', () => {
    it.each([
      ['getLockoutStatus', [target, 'id 1'], '/attack-detection/brute-force/users/id%201', undefined, {}],
      ['getUserSessions', [target, 'id-1'], '/users/id-1/sessions', undefined, []],
      ['getUserCredentials', [target, 'id-1'], '/users/id-1/credentials', undefined, []],
      ['getEventsConfig', [target], '/events/config', undefined, {}],
      ['listUserEvents', [target, 'id-1', 50], '/events', { user: 'id-1', first: 0, max: 50 }, []],
      ['getRealmSettings', [target], '', undefined, {}],
    ] as const)('%s reads %s with the user token', async (method, args, path, params, data) => {
      mockedGet.mockResolvedValueOnce({ data });

      const result = await (reader[method] as (...values: unknown[]) => Promise<unknown>)(...args);

      expect(result).toEqual({ ok: true, value: data });
      expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}${path}`, { ...requestOptions, params });
    });

    it('reports a missing view-events permission as no permission', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(HttpStatusCodes.FORBIDDEN));

      expect(await reader.listUserEvents(target, 'id-1', 10)).toMatchObject({
        ok: false,
        problem: { reason: 'NO_PERMISSION' },
      });
    });
  });
});
