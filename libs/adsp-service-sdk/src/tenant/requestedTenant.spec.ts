import { AdspIdFormatError } from '../utils';
import { getRequestedTenant } from './requestedTenant';

describe('getRequestedTenant', () => {
  const serviceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const value = 'urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7';
  const axiosError = (status: number, url: string) =>
    Object.assign(new Error(`Request failed with status code ${status}`), {
      isAxiosError: true,
      config: { url },
      response: { status },
    });

  beforeEach(() => {
    serviceMock.getTenant.mockReset();
  });

  it('can return the tenant', async () => {
    const tenant = { id: value, name: 'test', realm: 'test' };
    serviceMock.getTenant.mockResolvedValueOnce(tenant);
    await expect(getRequestedTenant(serviceMock, value)).resolves.toBe(tenant);
  });

  it.each([
    ['a repeated value', [value, value]],
    ['a malformed URN', 'my-tenant'],
    ['a URN that is not a resource', 'urn:ads:platform:tenant-service'],
    ['a resource of another service', 'urn:ads:platform:file-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7'],
    ['a tenant resource that is not a tenant id', 'urn:ads:platform:tenant-service:v2:/tenants/missing'],
  ])('can reject %s', async (_name, tenantId) => {
    await expect(getRequestedTenant(serviceMock, tenantId)).rejects.toBeInstanceOf(AdspIdFormatError);
    expect(serviceMock.getTenant).not.toHaveBeenCalled();
  });

  it('can reject an unknown tenant from a tenant service 404', async () => {
    serviceMock.getTenant.mockRejectedValueOnce(axiosError(404, 'https://tenant/api/tenant/v2/tenants/61f2e3a8c9b1d2e3f4a5b6c7'));
    await expect(getRequestedTenant(serviceMock, value)).rejects.toBeInstanceOf(AdspIdFormatError);
  });

  it('can reject an unknown tenant when lookup resolves nothing', async () => {
    serviceMock.getTenant.mockResolvedValueOnce(undefined);
    await expect(getRequestedTenant(serviceMock, value)).rejects.toBeInstanceOf(AdspIdFormatError);
  });

  it('can pass through a 404 from another request', async () => {
    const error = axiosError(404, 'https://access/realms/core/protocol/openid-connect/token');
    serviceMock.getTenant.mockRejectedValueOnce(error);
    await expect(getRequestedTenant(serviceMock, value)).rejects.toBe(error);
  });

  it('can pass through other lookup errors', async () => {
    const error = axiosError(503, 'https://tenant/api/tenant/v2/tenants/61f2e3a8c9b1d2e3f4a5b6c7');
    serviceMock.getTenant.mockRejectedValueOnce(error);
    await expect(getRequestedTenant(serviceMock, value)).rejects.toBe(error);
  });
});
