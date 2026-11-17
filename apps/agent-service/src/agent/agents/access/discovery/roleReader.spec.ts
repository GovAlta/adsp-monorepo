import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { createRoleReader } from './roleReader';

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

const HOST = 'https://access.adsp-dev.gov.ab.ca';
const ADMIN_URL = `${HOST}/auth/admin/realms/realm-1`;
const user = { id: 'caller', token: { bearer: 'user-token' } } as unknown as User;
const target = { host: HOST, realm: 'realm-1', user };
const requestOptions = {
  headers: { Authorization: 'Bearer user-token', Accept: 'application/json' },
  timeout: 5000,
};
const page = (max: number) => ({ first: 0, max, briefRepresentation: true });

describe('createRoleReader', () => {
  const reader = createRoleReader();

  beforeEach(() => {
    mockedGet.mockReset();
  });

  it.each([
    ['getRole', [target, { name: 'admin role' }], '/roles/admin%20role', undefined, {}],
    [
      'getRole',
      [target, { name: 'tenant-admin', clientUuid: 'c-1' }],
      '/clients/c-1/roles/tenant-admin',
      undefined,
      {},
    ],
    ['listRealmRoles', [target], '/roles', { briefRepresentation: true }, []],
    ['listClientRoles', [target, 'c-1'], '/clients/c-1/roles', { briefRepresentation: true }, []],
    ['listRoleUsers', [target, { name: 'reader' }, 101], '/roles/reader/users', page(101), []],
    ['listRoleUsers', [target, { name: 'admin', clientUuid: 'c-1' }, 5], '/clients/c-1/roles/admin/users', page(5), []],
    ['listRoleGroups', [target, { name: 'reader' }, 26], '/roles/reader/groups', page(26), []],
    ['listGroupMembers', [target, 'g-1', 101], '/groups/g-1/members', page(101), []],
    ['listSubgroups', [target, 'g-1', 26], '/groups/g-1/children', page(26), []],
  ] as const)('%s reads %s with the user token', async (method, args, path, params, data) => {
    mockedGet.mockResolvedValueOnce({ data });

    const result = await (reader[method] as (...values: unknown[]) => Promise<unknown>)(...args);

    expect(result).toEqual({ ok: true, value: data });
    expect(mockedGet).toHaveBeenCalledWith(`${ADMIN_URL}${path}`, { ...requestOptions, params });
  });

  it('reports a missing role as ROLE_NOT_FOUND', async () => {
    const error = new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE');
    error.response = { status: HttpStatusCodes.NOT_FOUND, data: {}, statusText: '', headers: {}, config: {} as never };
    mockedGet.mockRejectedValueOnce(error);

    expect(await reader.getRole(target, { name: 'missing' })).toMatchObject({
      ok: false,
      problem: { status: 'not-found', reason: 'ROLE_NOT_FOUND' },
    });
  });

  it('reports a missing view-users permission when listing members', async () => {
    const error = new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE');
    error.response = { status: HttpStatusCodes.FORBIDDEN, data: {}, statusText: '', headers: {}, config: {} as never };
    mockedGet.mockRejectedValueOnce(error);

    expect(await reader.listRoleUsers(target, { name: 'reader' }, 5)).toMatchObject({
      ok: false,
      problem: { reason: 'NO_USER_PERMISSION' },
    });
  });
});
