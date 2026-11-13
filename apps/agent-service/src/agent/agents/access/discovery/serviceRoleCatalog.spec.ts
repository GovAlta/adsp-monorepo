import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import {
  createServiceRoleCatalogReader,
  matchServiceIds,
  normalizeServiceText,
  serviceShortName,
} from './serviceRoleCatalog';

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

function axiosError(status: number) {
  const error = new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE');
  error.response = { status, data: {}, statusText: '', headers: {}, config: {} as never };
  return error;
}

const CONFIGURATION_URL = 'https://configuration-service.test/configuration/v2';
const CATALOG_URL = 'https://configuration-service.test/configuration/v2/configuration/platform/tenant-service';
const directory = { getServiceUrl: jest.fn().mockResolvedValue(new URL(CONFIGURATION_URL)) };
const user = { id: 'caller', token: { bearer: 'user-token' } } as unknown as User;

const SERVICE_IDS = [
  'urn:ads:platform:form-service',
  'urn:ads:platform:form-gateway',
  'urn:ads:platform:notification-service',
  'urn:ads:platform:configuration-service',
  'urn:ads:platform:tenant-service',
  'urn:ads:demo:chat-service',
];

describe('serviceShortName', () => {
  it.each([
    ['urn:ads:platform:form-service', 'form-service'],
    ['urn:ads:platform:form-service:v1', 'form-service'],
    ['My-App', 'my-app'],
  ])('reads %s as %s', (id, name) => {
    expect(serviceShortName(id)).toBe(name);
  });
});

describe('normalizeServiceText', () => {
  it.each([
    ['forms', 'form'],
    ['Form Service', 'form'],
    ['form-service', 'form'],
    ['notifications', 'notification'],
    ['urn:ads:platform:tenant-service', 'tenant'],
  ])('normalizes %s to %s', (text, normalized) => {
    expect(normalizeServiceText(text)).toBe(normalized);
  });
});

describe('matchServiceIds', () => {
  it.each([
    ['urn:ads:platform:tenant-service', ['urn:ads:platform:tenant-service']],
    ['notifications', ['urn:ads:platform:notification-service']],
    ['Notification Service', ['urn:ads:platform:notification-service']],
    ['forms', ['urn:ads:platform:form-gateway', 'urn:ads:platform:form-service']],
    ['config', ['urn:ads:platform:configuration-service']],
    ['chat', ['urn:ads:demo:chat-service']],
    ['payments', []],
    ['   ', []],
  ])('matches %s', (text, expected) => {
    expect(matchServiceIds(SERVICE_IDS, text)).toEqual(expected);
  });
});

describe('createServiceRoleCatalogReader', () => {
  const reader = createServiceRoleCatalogReader({ directory: directory as unknown as ServiceDirectory });

  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('reads platform and tenant roles with the user token, sorted by service and role', async () => {
    mockedGet.mockImplementation(async (_url: string, options: { params?: { core?: boolean } }) => ({
      data: {
        latest: {
          configuration: options.params?.core
            ? {
                'urn:ads:platform:form-service': {
                  roles: [
                    { role: 'form-admin', description: 'Administers forms.', inTenantAdmin: true },
                    { role: 'form-applicant', description: '' },
                    { description: 'no role name' },
                  ],
                },
                'urn:ads:platform:empty-service': { roles: [] },
              }
            : { 'urn:ads:demo:chat-service': { roles: [{ role: 'chatter' }] } },
        },
      },
    }));

    const result = await reader.getCatalog(user);

    expect(result).toEqual({
      ok: true,
      value: [
        { service: 'urn:ads:demo:chat-service', source: 'tenant', roles: [{ role: 'chatter', inTenantAdmin: false }] },
        {
          service: 'urn:ads:platform:form-service',
          source: 'platform',
          roles: [
            { role: 'form-admin', description: 'Administers forms.', inTenantAdmin: true },
            { role: 'form-applicant', inTenantAdmin: false },
          ],
        },
      ],
    });
    expect(mockedGet).toHaveBeenCalledWith(CATALOG_URL, {
      headers: { Authorization: 'Bearer user-token' },
      params: { core: true },
      timeout: 5000,
    });
    expect(mockedGet).toHaveBeenCalledWith(CATALOG_URL, {
      headers: { Authorization: 'Bearer user-token' },
      params: undefined,
      timeout: 5000,
    });
  });

  it('treats a tenant without its own roles as having none', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { latest: { configuration: {} } } })
      .mockRejectedValueOnce(axiosError(HttpStatusCodes.NOT_FOUND));

    expect(await reader.getCatalog(user)).toEqual({ ok: true, value: [] });
  });

  it('reports when the user may not read configuration', async () => {
    mockedGet.mockRejectedValue(axiosError(HttpStatusCodes.FORBIDDEN));

    expect(await reader.getCatalog(user)).toMatchObject({
      ok: false,
      problem: { reason: 'NO_ROLE_CATALOG_ACCESS' },
    });
  });
});
