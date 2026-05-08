import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { ConfigurationServiceImpl } from './configurationService';

const cacheMock = jest.fn();
const cacheClear = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
    del = cacheClear;
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ConfigurationService', () => {
  const serviceId = adspId`urn:ads:platform:test`;
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  beforeEach(() => {
    cacheMock.mockReset();
    cacheClear.mockReset();
    axiosMock.get.mockReset();
  });

  it('can be constructed', () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);
    expect(service).toBeTruthy();
  });

  it('can getConfiguration from cache', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

    const config = { value: 'this is config' };
    cacheMock.mockReturnValueOnce({ configuration: config, revision: 0 });
    const [result] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result.value).toBe(config.value);
  });

  it('can getConfiguration from cache with null value', async () => {
    // Null value means the API received no value for the configuration (which is a valid state).
    // This should still be a cache hit to avoid extraneous API requests.
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

    cacheMock.mockReturnValueOnce({ configuration: null });
    const [result] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result).toBeNull();
  });

  it('can retrieve from API on cache miss', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

    cacheMock.mockReturnValueOnce(undefined);
    cacheMock.mockReturnValueOnce(undefined);

    const config = { value: 'this is config' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: config }));
    const configOptions = { value: 'this is core' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result.value).toBe(config.value);
    expect(options.value).toBe(configOptions.value);
  });

  it('can handle no configuration from API', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

    cacheMock.mockReturnValueOnce(undefined);
    cacheMock.mockReturnValueOnce(undefined);

    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: null }));
    const configOptions = { value: 'this is core' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result).toBeFalsy();
    expect(options.value).toBe(configOptions.value);
  });

  it('can use converter', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converter = () => ({ value: 'converted' });
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, false, converter);

    cacheMock.mockReturnValueOnce(undefined);
    cacheMock.mockReturnValueOnce(undefined);

    const config = { value: 'this is tenant' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: config }));
    const configOptions = { value: 'this is core' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result.value).toBe('converted');
    expect(options.value).toBe('converted');
  });

  it('can use default if null converter provided', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, false, null);

    cacheMock.mockReturnValueOnce(undefined);
    cacheMock.mockReturnValueOnce(undefined);

    const config = { value: 'this is tenant' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: config }));
    const configOptions = { value: 'this is core' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result.value).toBe(config.value);
    expect(options.value).toBe(configOptions.value);
  });

  it('can use combine', async () => {
    const combine = () => 'combined';
    const service = new ConfigurationServiceImpl(
      serviceId,
      logger,
      directoryMock,
      tokenProviderMock,
      false,
      null,
      combine,
    );

    cacheMock.mockReturnValueOnce({ value: 'this is tenant' });
    cacheMock.mockReturnValueOnce({ value: 'this is core' });

    const combined = await service.getConfiguration<{ value: string }, string>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(combined).toBe('combined');
  });

  it('can use combine with memoized result', async () => {
    const combine = jest.fn(() => 'combined');
    const service = new ConfigurationServiceImpl(
      serviceId,
      logger,
      directoryMock,
      tokenProviderMock,
      false,
      null,
      combine,
    );

    const tenant = { value: 'this is tenant' };
    const core = { value: 'this is core' };
    cacheMock.mockImplementation(() => tenant);
    cacheMock.mockImplementation(() => core);

    await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );
    await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );
    const combined = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(combined).toBe('combined');
    expect(combine).toHaveBeenCalledTimes(1);
  });

  it('can clear cached', () => {
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

    cacheClear.mockReturnValueOnce(1);
    service.clearCached(tenantId, serviceId.namespace, serviceId.service);

    expect(cacheClear).toHaveBeenCalled();
  });

  describe('getServiceConfiguration', () => {
    it('can retrieve configuration', async () => {
      const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

      const config = { value: 'this is config' };
      cacheMock.mockReturnValueOnce({ configuration: config, revision: 0 });
      const [result, _, revision] = await service.getServiceConfiguration<{ value: string }>(
        null,
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      );

      expect(result.value).toBe(config.value);
      expect(revision).toBe(0);
    });

    it('can retrieve named configuration', async () => {
      const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, true);

      const config = { value: 'this is config' };
      cacheMock.mockReturnValueOnce({ configuration: config, revision: 0 });
      const [result] = await service.getServiceConfiguration<{ value: string }>(
        'test',
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      );

      expect(result.value).toBe(config.value);
    });

    it('can throw for unspecified named configuration', async () => {
      const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, true);

      const config = { value: 'this is config' };
      cacheMock.mockReturnValueOnce({ configuration: config, revision: 0 });
      await expect(
        service.getServiceConfiguration<{ value: string }>(
          null,
          adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        ),
      ).rejects.toThrow(Error);
    });

    it('can retrieve from API on cache miss', async () => {
      const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, true);

      cacheMock.mockReturnValueOnce(undefined);
      cacheMock.mockReturnValueOnce(undefined);

      const config = { value: 'this is config' };
      axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { configuration: config, revision: 0 } }));
      const configOptions = { value: 'this is core' };
      axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { configuration: configOptions, revision: 0 } }));

      const [result, options] = await service.getServiceConfiguration<{ value: string }>(
        'test',
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      );

      expect(result.value).toBe(config.value);
      expect(options.value).toBe(configOptions.value);
    });

    it('can handle no configuration from API', async () => {
      const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

      cacheMock.mockReturnValueOnce(undefined);
      cacheMock.mockReturnValueOnce(undefined);

      axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: null }));
      axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { configuration: null, revision: 0 } }));

      const [result, options] = await service.getServiceConfiguration<{ value: string }>(
        'test',
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      );

      expect(result).toBeFalsy();
      expect(options).toBeFalsy();
    });
  });
});

describe('getServiceConfigurationRevision', () => {
  const serviceId = adspId`urn:ads:platform:test`;
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  it('can retrieve configuration revision from cache', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock);

    const config = { value: 'this is config revision' };
    cacheMock.mockReturnValueOnce({ configuration: config, revision: 2 });

    const [result, _, revision] = await service.getServiceConfigurationRevision<{ value: string }>(
      '2',
      null,
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result.value).toBe(config.value);
    expect(revision).toBe(2);
  });

  it('can retrieve named configuration revision from cache', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, true);

    const config = { value: 'this is named config revision' };
    cacheMock.mockReturnValueOnce({ configuration: config, revision: 3 });

    const [result, _, revision] = await service.getServiceConfigurationRevision<{ value: string }>(
      '3',
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result.value).toBe(config.value);
    expect(revision).toBe(3);
  });

  it('can throw for unspecified named configuration revision', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, true);

    await expect(
      service.getServiceConfigurationRevision<{ value: string }>(
        '2',
        null,
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      ),
    ).rejects.toThrow(Error);
  });

  it('can retrieve configuration revision from API on cache miss', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, true);

    cacheMock.mockReturnValueOnce(undefined);
    cacheMock.mockReturnValueOnce(undefined);

    const config = { value: 'this is tenant revision config' };
    const configOptions = { value: 'this is core revision config' };

    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: config }));
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options, revision] = await service.getServiceConfigurationRevision<{ value: string }>(
      '4',
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result.value).toBe(config.value);
    expect(options.value).toBe(configOptions.value);
    expect(revision).toBe(4);

    const revision4Calls = axiosMock.get.mock.calls.filter(([url]) =>
      url.includes('/v2/configuration/test/test/revisions/4'),
    );

    expect(revision4Calls).toHaveLength(2);

    expect(revision4Calls[0]).toEqual([
      'http://totally-real-directory/v2/configuration/test/test/revisions/4',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        params: expect.objectContaining({
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
        }),
      }),
    ]);

    expect(revision4Calls[1]).toEqual([
      'http://totally-real-directory/v2/configuration/test/test/revisions/4',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        params: expect.objectContaining({
          tenantId: undefined,
        }),
      }),
    ]);
  });

  it('can pass parsed revision to combine', async () => {
    const combine = jest.fn(() => 'combined revision');

    const service = new ConfigurationServiceImpl(
      serviceId,
      logger,
      directoryMock,
      tokenProviderMock,
      true,
      null,
      combine,
    );

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const tenantConfig = { value: 'this is tenant revision config' };
    const coreConfig = { value: 'this is core revision config' };

    cacheMock.mockReturnValueOnce({ configuration: tenantConfig });
    cacheMock.mockReturnValueOnce({ configuration: coreConfig });

    const result = await service.getServiceConfigurationRevision<{ value: string }, string>('5', 'test', tenantId);

    expect(result).toBe('combined revision');
    expect(combine).toHaveBeenCalledWith(tenantConfig, coreConfig, tenantId, 5);
  });

  it('can handle no configuration revision from API', async () => {
    const service = new ConfigurationServiceImpl(serviceId, logger, directoryMock, tokenProviderMock, true);

    cacheMock.mockReturnValueOnce(undefined);
    cacheMock.mockReturnValueOnce(undefined);

    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: null }));
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: null }));

    const [result, options, revision] = await service.getServiceConfigurationRevision<{ value: string }>(
      '6',
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    );

    expect(result).toBeFalsy();
    expect(options).toBeFalsy();
    expect(revision).toBe(6);
  });
});
