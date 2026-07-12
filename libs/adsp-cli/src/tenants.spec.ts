jest.mock('./directory', () => ({
  getServiceUrls: jest.fn(),
}));

import { getServiceUrls } from './directory';
import { HttpRequestError } from './httpError';
import { findTenantByName, findTenantByRealm, listTenants } from './tenants';

const mockGetServiceUrls = getServiceUrls as jest.Mock;

const TENANT_SERVICE_URL = 'https://tenant-service.example.com';

beforeEach(() => {
  mockGetServiceUrls.mockResolvedValue({ 'urn:ads:platform:tenant-service:v2': TENANT_SERVICE_URL });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('findTenantByName', () => {
  it('GETs by name with no Authorization header (anonymous)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ name: 'my-tenant', realm: 'my-realm' }] }),
    });
    global.fetch = fetchMock as never;

    const tenant = await findTenantByName('https://directory-service.example.com', 'my-tenant');

    expect(tenant).toEqual({ name: 'my-tenant', realm: 'my-realm' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${TENANT_SERVICE_URL}/v2/tenants?name=my-tenant`);
    expect(init).toBeUndefined();
  });

  it('returns null when no tenant matches', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }) as never;

    expect(await findTenantByName('https://directory-service.example.com', 'unknown')).toBeNull();
  });

  it('throws an HttpRequestError carrying the status on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as never;

    await expect(findTenantByName('https://directory-service.example.com', 'my-tenant')).rejects.toBeInstanceOf(
      HttpRequestError
    );
  });

  it('throws when tenant-service is not in the directory', async () => {
    mockGetServiceUrls.mockResolvedValue({});

    await expect(findTenantByName('https://directory-service.example.com', 'my-tenant')).rejects.toThrow(
      'was not found in the directory'
    );
  });
});

describe('findTenantByRealm', () => {
  it('GETs by realm with no Authorization header (anonymous)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ name: 'my-tenant', realm: 'my-realm' }] }),
    });
    global.fetch = fetchMock as never;

    const tenant = await findTenantByRealm('https://directory-service.example.com', 'my-realm');

    expect(tenant).toEqual({ name: 'my-tenant', realm: 'my-realm' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${TENANT_SERVICE_URL}/v2/tenants?realm=my-realm`);
    expect(init).toBeUndefined();
  });

  it('returns null when no tenant matches', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }) as never;

    expect(await findTenantByRealm('https://directory-service.example.com', 'unknown-realm')).toBeNull();
  });

  it('throws an HttpRequestError carrying the status on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as never;

    await expect(findTenantByRealm('https://directory-service.example.com', 'my-realm')).rejects.toBeInstanceOf(
      HttpRequestError
    );
  });
});

describe('listTenants', () => {
  it('GETs the full list with a bearer token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ name: 'tenant-a', realm: 'realm-a' }] }),
    });
    global.fetch = fetchMock as never;

    const tenants = await listTenants('https://directory-service.example.com', 'core-token');

    expect(tenants).toEqual([{ name: 'tenant-a', realm: 'realm-a' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${TENANT_SERVICE_URL}/v2/tenants`);
    expect(init.headers.Authorization).toBe('Bearer core-token');
  });

  it('returns an empty array when results is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as never;

    expect(await listTenants('https://directory-service.example.com', 'core-token')).toEqual([]);
  });

  it('throws an HttpRequestError carrying the status on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 }) as never;

    await expect(listTenants('https://directory-service.example.com', 'core-token')).rejects.toBeInstanceOf(
      HttpRequestError
    );
  });
});
