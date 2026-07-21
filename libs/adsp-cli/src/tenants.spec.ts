jest.mock('./directory', () => ({
  getServiceUrls: jest.fn(),
}));

import { getServiceUrls } from './directory';
import { HttpRequestError } from './httpError';
import { createTenant, findTenantByName, findTenantByRealm, getTenantById, listTenants, waitForTenantActive } from './tenants';

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

describe('createTenant', () => {
  it('POSTs the name with a bearer token and returns the provisioning tenant', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'my-tenant', realm: 'generated-realm', status: 'provisioning' }),
    });
    global.fetch = fetchMock as never;

    const tenant = await createTenant('https://directory-service.example.com', 'core-token', 'my-tenant');

    expect(tenant).toEqual({ name: 'my-tenant', realm: 'generated-realm', status: 'provisioning' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${TENANT_SERVICE_URL}/v2/tenants`);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer core-token');
    expect(JSON.parse(init.body)).toEqual({ name: 'my-tenant' });
  });

  it('surfaces the server-provided errorMessage on a 400 validation failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ errorMessage: 'This tenant name has already been used. Please enter a different tenant name.' }),
    }) as never;

    await expect(createTenant('https://directory-service.example.com', 'core-token', 'taken-name')).rejects.toMatchObject({
      status: 400,
      message: 'This tenant name has already been used. Please enter a different tenant name.',
    });
  });

  it('surfaces a hardcoded message on a bare 401 (missing beta-tester role)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => {
        throw new Error('no body');
      },
    }) as never;

    await expect(createTenant('https://directory-service.example.com', 'core-token', 'my-tenant')).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("beta-tester"),
    });
  });

  it('falls back to a generic message when the JSON error body has no errorMessage field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    }) as never;

    await expect(createTenant('https://directory-service.example.com', 'core-token', 'my-tenant')).rejects.toMatchObject({
      status: 400,
      message: 'Tenant service request failed with status 400.',
    });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('no body');
      },
    }) as never;

    await expect(createTenant('https://directory-service.example.com', 'core-token', 'my-tenant')).rejects.toMatchObject({
      status: 500,
      message: 'Tenant service request failed with status 500.',
    });
  });
});

describe('getTenantById', () => {
  it('GETs by id with a bearer token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'my-tenant', realm: 'r', status: 'active' }),
    });
    global.fetch = fetchMock as never;

    const tenant = await getTenantById('https://directory-service.example.com', 'core-token', 'tenant-a');

    expect(tenant).toEqual({ name: 'my-tenant', realm: 'r', status: 'active' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${TENANT_SERVICE_URL}/v2/tenants/tenant-a`);
    expect(init.headers.Authorization).toBe('Bearer core-token');
  });

  it('returns null on a 404 (tenant rolled back after a failed provisioning)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as never;

    expect(await getTenantById('https://directory-service.example.com', 'core-token', 'tenant-a')).toBeNull();
  });

  it('throws an HttpRequestError carrying the status on a non-404 error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('no body');
      },
    }) as never;

    await expect(
      getTenantById('https://directory-service.example.com', 'core-token', 'tenant-a')
    ).rejects.toBeInstanceOf(HttpRequestError);
  });
});

describe('waitForTenantActive', () => {
  const createdTenant = { id: 'urn:ads:platform:tenant-service:v2:/tenants/tenant-a', name: 'my-tenant', realm: 'r' };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves once status flips to active', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'my-tenant', realm: 'r', status: 'provisioning' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'my-tenant', realm: 'r', status: 'active' }) });
    global.fetch = fetchMock as never;

    const resultPromise = waitForTenantActive('https://directory-service.example.com', 'core-token', createdTenant);
    await jest.advanceTimersByTimeAsync(3000);

    expect(await resultPromise).toEqual({ name: 'my-tenant', realm: 'r', status: 'active' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${TENANT_SERVICE_URL}/v2/tenants/tenant-a`);
    expect(init.headers.Authorization).toBe('Bearer core-token');
  });

  it('throws if the tenant disappears (provisioning failed and was rolled back)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as never;

    await expect(
      waitForTenantActive('https://directory-service.example.com', 'core-token', createdTenant)
    ).rejects.toThrow('provisioning failed');
  });

  it('throws when provisioning does not finish before the timeout', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'my-tenant', realm: 'r', status: 'provisioning' }),
    }) as never;

    const resultPromise = waitForTenantActive('https://directory-service.example.com', 'core-token', createdTenant, {
      intervalMs: 10,
      timeoutMs: 20,
    });
    const assertion = expect(resultPromise).rejects.toThrow('Timed out waiting');
    await jest.advanceTimersByTimeAsync(1000);

    await assertion;
  });
});
