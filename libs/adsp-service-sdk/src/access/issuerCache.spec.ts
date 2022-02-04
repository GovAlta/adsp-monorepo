import { Logger } from 'winston';
import { adspId } from '../utils';
import { IssuerCache } from './issuerCache';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

describe('IssuerCache', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const serviceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.getTenant.mockReset();
    serviceMock.getTenants.mockReset();
    serviceMock.getTenantByName.mockReset();
  });
  it('can be constructed', () => {
    const cache = new IssuerCache(logger, new URL('http://totally-access'), serviceMock);
    expect(cache).toBeTruthy();
  });

  it('can get tenant from cache', async () => {
    const tenant = {
      id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      realm: 'test',
    };

    cacheMock.mockReturnValueOnce(tenant);

    const cache = new IssuerCache(logger, new URL('http://totally-access'), serviceMock);
    const result = await cache.getTenantByIssuer('issuer');

    expect(result).toBe(tenant);
  });

  it('can get tenants from service on cache miss', async () => {
    const tenant = {
      id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      realm: 'test',
    };

    cacheMock.mockReturnValueOnce(null);
    serviceMock.getTenants.mockResolvedValueOnce([tenant]);
    cacheMock.mockReturnValueOnce(tenant);

    const cache = new IssuerCache(logger, new URL('http://totally-access'), serviceMock);
    const result = await cache.getTenantByIssuer('issuer');

    expect(result).toBe(tenant);
    expect(serviceMock.getTenants).toHaveBeenCalledTimes(1);
  });

  it('can return null on update error', async () => {
    const tenant = {
      id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      realm: 'test',
    };

    cacheMock.mockReturnValueOnce(null);
    serviceMock.getTenants.mockRejectedValueOnce(new Error('Something went terribly wrong.'));
    cacheMock.mockReturnValueOnce(tenant);

    const cache = new IssuerCache(logger, new URL('http://totally-access'), serviceMock);
    const result = await cache.getTenantByIssuer('issuer');

    expect(result).toBeFalsy();
    expect(serviceMock.getTenants).toHaveBeenCalledTimes(1);
  });
});
