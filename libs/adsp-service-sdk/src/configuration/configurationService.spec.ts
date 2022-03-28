import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { ConfigurationServiceImpl } from './configurationService';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ConfigurationService', () => {
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

  it('can be constructed', () => {
    const service = new ConfigurationServiceImpl(logger, directoryMock);
    expect(service).toBeTruthy();
  });

  it('can getConfiguration from cache', async () => {
    const service = new ConfigurationServiceImpl(logger, directoryMock);

    const config = { value: 'this is config' };
    cacheMock.mockReturnValueOnce(config);
    const [result] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe(config.value);
  });

  it('can retrieve from API on cache miss', async () => {
    const service = new ConfigurationServiceImpl(logger, directoryMock);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);

    const config = { value: 'this is config' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: config }));
    const configOptions = { value: 'this is core' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe(config.value);
    expect(options.value).toBe(configOptions.value);
  });

  it('can use converter', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converter = () => ({ value: 'converted' });
    const service = new ConfigurationServiceImpl(logger, directoryMock, converter);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);

    const config = { value: 'this is tenant' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: config }));
    const configOptions = { value: 'this is core' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe('converted');
    expect(options.value).toBe('converted');
  });

  it('can use default if null converter provided', async () => {
    const service = new ConfigurationServiceImpl(logger, directoryMock, null);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);

    const config = { value: 'this is tenant' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: config }));
    const configOptions = { value: 'this is core' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: configOptions }));

    const [result, options] = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe(config.value);
    expect(options.value).toBe(configOptions.value);
  });

  it('can use combine', async () => {
    const combine = () => 'combined';
    const service = new ConfigurationServiceImpl(logger, directoryMock, null, combine);

    cacheMock.mockReturnValueOnce({ value: 'this is tenant' });
    cacheMock.mockReturnValueOnce({ value: 'this is core' });

    const combined = await service.getConfiguration<{ value: string }, string>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(combined).toBe('combined');
  });

  it('can use combine with memoized result', async () => {
    const combine = jest.fn(() => 'combined');
    const service = new ConfigurationServiceImpl(logger, directoryMock, null, combine);

    const tenant = { value: 'this is tenant' };
    const core = { value: 'this is core' };
    cacheMock.mockImplementation(() => tenant);
    cacheMock.mockImplementation(() => core);

    await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );
    await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );
    const combined = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(combined).toBe('combined');
    expect(combine).toHaveBeenCalledTimes(1);
  });
});
