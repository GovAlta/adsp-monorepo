import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { TenantServiceImpl } from './tenantService';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('TenantService', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-service/api/tenant/v2'))),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  beforeEach(() => {
    axiosMock.get.mockReset();
    cacheMock.mockReset();
  });

  it('can be constructed', () => {
    const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);
    expect(service).toBeTruthy();
  });

  it('can getTenant from cache', async () => {
    axiosMock.get.mockImplementationOnce(() => Promise.resolve({ data: [] }));

    const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

    const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const result = { id, name: 'test', realm: 'test' };
    cacheMock.mockReturnValueOnce(result);

    const tenant = await service.getTenant(id);
    expect(tenant).toBe(result);
  });

  it('can retrieve from API on cache miss', async () => {
    const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const result = { id, name: 'test', realm: 'test' };
    axiosMock.get.mockImplementation((url) => {
      expect(url).toBe('http://totally-real-service/api/tenant/v2/tenants/test');
      return Promise.resolve(url.includes('test') ? { data: { ...result, id: `${result.id}` } } : { data: [] });
    });

    const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

    cacheMock.mockReturnValueOnce(null);
    const tenant = await service.getTenant(id);
    expect(`${tenant.id}`).toBe(`${result.id}`);
  });

  describe('getTenantByName', () => {
    it('can get tenant by name', async () => {
      const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const result = { id, name: 'Test', realm: 'test' };

      const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

      axiosMock.get.mockImplementation((url) => {
        expect(url).toBe('http://totally-real-service/api/tenant/v2/tenants/test');
        return Promise.resolve(
          url.includes('test') ? { data: { ...result, id: `${result.id}` } } : { data: { results: [] } }
        );
      });

      cacheMock.mockReturnValueOnce(null);
      await service.getTenant(id);
      const tenant = await service.getTenantByName('test');
      expect(`${tenant.id}`).toBe(`${result.id}`);
    });

    it('can query for never retrieved tenant', async () => {
      const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`;
      const result = { id, name: 'Test2', realm: 'test2' };

      const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

      axiosMock.get.mockResolvedValueOnce({
        data: { results: [{ ...result, id: `${result.id}` }], page: { size: 1 } },
      });
      // After retrieval from API, the value is cached.
      cacheMock.mockReturnValueOnce(result);
      const tenant = await service.getTenantByName('test2');
      expect(tenant).toMatchObject({ name: 'Test2' });
      expect(axiosMock.get).toHaveBeenCalled();
    });

    it('can return falsy for falsy name', async () => {
      const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

      const tenant = await service.getTenantByName('');
      expect(tenant).toBeFalsy();
    });
  });

  describe('getTenantByRealm', () => {
    it('can get tenant by realm', async () => {
      const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const result = { id, name: 'Test', realm: 'test' };

      const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

      axiosMock.get.mockImplementation((url) => {
        expect(url).toBe('http://totally-real-service/api/tenant/v2/tenants/test');
        return Promise.resolve(
          url.includes('test') ? { data: { ...result, id: `${result.id}` } } : { data: { results: [] } }
        );
      });

      cacheMock.mockReturnValueOnce(null);
      await service.getTenant(id);
      const tenant = await service.getTenantByRealm('test');
      expect(`${tenant.id}`).toBe(`${result.id}`);
    });

    it('can query for never retrieved tenant', async () => {
      const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`;
      const result = { id, name: 'Test2', realm: 'test2' };

      const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

      axiosMock.get.mockResolvedValueOnce({
        data: { results: [{ ...result, id: `${result.id}` }], page: { size: 1 } },
      });
      // After retrieval from API, the value is cached.
      cacheMock.mockReturnValueOnce(result);
      const tenant = await service.getTenantByRealm('test2');
      expect(tenant).toMatchObject({ name: 'Test2' });
      expect(axiosMock.get).toHaveBeenCalled();
    });

    it('can return falsy for falsy realm', async () => {
      const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock, false);

      const tenant = await service.getTenantByRealm('');
      expect(tenant).toBeFalsy();
    });
  });
});
