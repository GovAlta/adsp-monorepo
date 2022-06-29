import { AdspId, adspId } from '@abgov/adsp-service-sdk';
import { TenantRepository } from '../../repository';
import { getTenant, getTenants } from './get';

describe('get', () => {
  const repositoryMock = {
    get: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.get.mockReset();
    repositoryMock.find.mockReset();
  });

  describe('getTenant', () => {
    it('can get tenant', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-123`;
      const tenant = {
        name: 'tenant',
        id: 'tenant-123',
        realm: 'tenant-123-realm',
      };
      repositoryMock.get.mockResolvedValueOnce(tenant);
      const result = await getTenant(repositoryMock as unknown as TenantRepository, tenantId);
      expect(result).toMatchObject({ name: tenant.name, realm: tenant.realm, id: expect.any(AdspId) });
      expect(repositoryMock.get).toHaveBeenCalledWith('tenant-123');
    });
  });

  describe('getTenants', () => {
    it('can get tenants', async () => {
      const tenant = {
        name: 'tenant',
        id: 'tenant-123',
        realm: 'tenant-123-realm',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      const result = await getTenants(repositoryMock as unknown as TenantRepository);
      expect(result).toContainEqual({ name: tenant.name, realm: tenant.realm, id: expect.any(AdspId) });
      expect(repositoryMock.find).toHaveBeenCalledWith(undefined);
    });

    it('can get tenants with criteria', async () => {
      const tenant = {
        name: 'tenant',
        id: 'tenant-123',
        realm: 'tenant-123-realm',
      };
      const criteria = {};
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      const result = await getTenants(repositoryMock as unknown as TenantRepository, criteria);
      expect(result).toContainEqual({ name: tenant.name, realm: tenant.realm, id: expect.any(AdspId) });
      expect(repositoryMock.find).toHaveBeenCalledWith(criteria);
    });
  });
});
