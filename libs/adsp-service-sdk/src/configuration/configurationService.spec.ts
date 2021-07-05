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
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
  };

  it('can be constructed', () => {
    const service = new ConfigurationServiceImpl(logger, directoryMock);
    expect(service).toBeTruthy();
  });

  it('can getConfiguration from cache', async (done) => {
    const service = new ConfigurationServiceImpl(logger, directoryMock);

    const config = { value: 'this is config' };
    cacheMock.mockReturnValueOnce(config);
    const result = await service.getConfiguration<{ value: string }>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe(config.value);
    done();
  });

  it('can retrieve from API on cache miss', async (done) => {
    const service = new ConfigurationServiceImpl(logger, directoryMock);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);

    const config = { value: 'this is config' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { configuration: config } }));
    const options = 'this is options';
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { results: [{ configOptions: options }] } }));

    const result = await service.getConfiguration<{ value: string }, string>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe(config.value);
    expect(result.options).toBe(options);
    done();
  });

  it('can use converter', async (done) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converter = (c: unknown) => ((c as any)?.value ? { value: 'converted' } : 'converted');
    const service = new ConfigurationServiceImpl(logger, directoryMock, converter);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);

    const config = { value: 'this is config' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { configuration: config } }));
    const options = 'this is options';
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { results: [{ configOptions: options }] } }));

    const result = await service.getConfiguration<{ value: string }, string>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe('converted');
    expect(result.options).toBe('converted');
    done();
  });

  it('can use default if null converter provided', async (done) => {
    const service = new ConfigurationServiceImpl(logger, directoryMock, null);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);

    const config = { value: 'this is config' };
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { configuration: config } }));
    const options = 'this is options';
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: { results: [{ configOptions: options }] } }));

    const result = await service.getConfiguration<{ value: string }, string>(
      adspId`urn:ads:platform:test`,
      'test',
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(result.value).toBe(config.value);
    expect(result.options).toBe(options);
    done();
  });
});
