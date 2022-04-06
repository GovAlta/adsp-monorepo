import axios from 'axios';
import type { Logger } from 'winston';
import { TokenProvider } from '../access';
import { adspId } from '../utils';
import { ServiceDirectoryImpl } from './serviceDirectory';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ServiceDirectory', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProvider: TokenProvider = {
    getAccessToken: jest.fn(),
  };

  it('can create ServiceDirectory', () => {
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);
    expect(directory).toBeTruthy();
  });

  it('can retrieve service URL from cache', async () => {
    const cached = 'https://test-service';
    const serviceId = adspId`urn:ads:test-sandbox:test-service`;
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValue(cached);
    const result = await directory.getServiceUrl(serviceId);
    expect(result).toBe(cached);
  });

  it('can retrieve API URL from cache', async () => {
    const cached = 'https://test-service';
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValue(cached);
    const result = await directory.getServiceUrl(apiId);
    expect(result).toBe(cached);
  });

  it('can retrieve API URL from directory', async () => {
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;
    const apiUrl = 'https://test-service';

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [{ urn: `${adspId}`, url: apiUrl }] }));
    const result = await directory.getServiceUrl(apiId);

    expect(result).toBe(apiUrl);
    expect(axiosMock.get).toHaveBeenCalledWith(
      'https://directory/api/directory/v2/namespaces/test-sandbox',
      expect.any(Object)
    );
  });

  it('can throw for missing entry', async () => {
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [] }));

    await expect(directory.getServiceUrl(apiId)).rejects.toThrowError(/^Failed to find directory entry for /);
    expect(axiosMock.get).toHaveBeenCalled();
  });

  it('can retrieve resource URL from directory', async () => {
    const resourceId = adspId`urn:ads:test-sandbox:test-service:v1:/tests/test`;
    const apiUrl = new URL('https://test-service/v1');

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [{ urn: `${adspId}`, url: apiUrl }] }));
    const result = await directory.getResourceUrl(resourceId);

    expect(result.href).toBe(`${apiUrl.href}/tests/test`);
    expect(axiosMock.get).toHaveBeenCalled();
  });

  it('can retrieve resource URL from directory with trailing slashes', async () => {
    const resourceId = adspId`urn:ads:test-sandbox:test-service:v1:/tests/test`;
    const apiUrl = new URL('https://test-service/v1/');

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [{ urn: `${adspId}`, url: apiUrl }] }));
    const result = await directory.getResourceUrl(resourceId);

    expect(result.href).toBe(`${apiUrl.href}tests/test`);
    expect(axiosMock.get).toHaveBeenCalled();
  });
});
