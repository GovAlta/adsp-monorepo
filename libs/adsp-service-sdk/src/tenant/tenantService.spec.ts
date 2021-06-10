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
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-service/api/tenant/v2'))),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  beforeEach(() => axiosMock.get.mockReset());

  it('can be constructed', (done) => {
    axiosMock.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: [{ id: 'urn:ads:platform:tenant-service:v2:/tenants/test', name: 'test' }] },
      }).then((r) => done() || r)
    );

    const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock);
    expect(service).toBeTruthy();
  });

  it('can getTenant from cache', async (done) => {
    axiosMock.get.mockImplementationOnce(() => Promise.resolve({ data: [] }));

    const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock);

    const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const result = { id, name: 'test' };
    cacheMock.mockReturnValueOnce(result);

    const tenant = await service.getTenant(id);
    expect(tenant).toBe(result);

    done();
  });

  it('can retrieve from API on cache miss', async (done) => {
    const id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const result = { id, name: 'test' };
    axiosMock.get.mockImplementation((url) => {
      expect(url).toBe("http://totally-real-service/api/tenant/v2/tenants/test");
      return Promise.resolve(url.includes('test') ? { data: { ...result, id: `${result.id}` } } : { data: [] })
    });

    const service = new TenantServiceImpl(logger, directoryMock, tokenProviderMock);

    cacheMock.mockReturnValueOnce(null);
    const tenant = await service.getTenant(id);
    expect(`${tenant.id}`).toBe(`${result.id}`);

    done();
  });
});
