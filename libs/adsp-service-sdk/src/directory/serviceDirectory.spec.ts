import axios from 'axios';
import type { Logger } from 'winston';
import { adspId } from '../utils';
import { ServiceDirectoryImpl } from './serviceDirectory';

const cacheMock = jest.fn();
const cacheSetMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = cacheSetMock;
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

  beforeEach(() => {
    cacheMock.mockReset();
    cacheSetMock.mockReset();
  });

  it('can create ServiceDirectory', () => {
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));
    expect(directory).toBeTruthy();
  });

  it('can retrieve service URL from cache', async () => {
    const cached = 'https://test-service';
    const serviceId = adspId`urn:ads:test-sandbox:test-service`;
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));

    cacheMock.mockReturnValue(cached);
    const result = await directory.getServiceUrl(serviceId);
    expect(result).toBe(cached);
  });

  it('can retrieve API URL from cache', async () => {
    const cached = 'https://test-service';
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));

    cacheMock.mockReturnValue(cached);
    const result = await directory.getServiceUrl(apiId);
    expect(result).toBe(cached);
  });

  it('can retrieve API URL from directory', async () => {
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;
    const apiUrl = 'https://test-service';

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [{ urn: `${apiId}`, url: apiUrl }] }));
    const result = await directory.getServiceUrl(apiId);

    expect(result).toBe(apiUrl);
    expect(axiosMock.get).toHaveBeenCalledWith('https://directory/directory/v2/namespaces/test-sandbox/entries');
    expect(cacheSetMock).toHaveBeenCalledWith(apiId.toString(), expect.any(URL));
  });

  it('can override URLs from directory', async () => {
    const serviceId = adspId`urn:ads:test-sandbox:test-service`;
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;
    const serviceUrl = 'https://test-service';
    const apiUrl = 'https://test-service/v1';
    process.env['DIR_TEST_SANDBOX_TEST_SERVICE'] = serviceUrl;
    process.env['DIR_TEST_SANDBOX_TEST_SERVICE_V1'] = apiUrl;

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(serviceUrl);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(
      Promise.resolve({
        data: [
          { urn: `${serviceId}`, url: 'https://original-entry' },
          { urn: `${apiId}`, url: 'https://original-entry' },
        ],
      })
    );
    let result = await directory.getServiceUrl(serviceId);
    expect(result).toBe(serviceUrl);
    result = await directory.getServiceUrl(apiId);
    expect(result).toBe(apiUrl);
    expect(cacheSetMock).toHaveBeenCalledWith(serviceId.toString(), expect.any(URL));
    expect(cacheSetMock).toHaveBeenCalledWith(apiId.toString(), expect.any(URL));
  });

  it('can throw for missing entry', async () => {
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [] }));

    await expect(directory.getServiceUrl(apiId)).rejects.toThrowError(/^Failed to find directory entry for /);
    expect(axiosMock.get).toHaveBeenCalled();
  });

  it('can retrieve resource URL from directory', async () => {
    const resourceId = adspId`urn:ads:test-sandbox:test-service:v1:/tests/test`;
    const apiUrl = new URL('https://test-service/v1');

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [{ urn: `${apiUrl}`, url: apiUrl }] }));
    const result = await directory.getResourceUrl(resourceId);

    expect(result.href).toBe(`${apiUrl.href}/tests/test`);
    expect(axiosMock.get).toHaveBeenCalled();
  });

  it('can retrieve resource URL from directory with trailing slashes', async () => {
    const resourceId = adspId`urn:ads:test-sandbox:test-service:v1:/tests/test`;
    const apiUrl = new URL('https://test-service/v1/');

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'));

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [{ urn: `${apiUrl}`, url: apiUrl }] }));
    const result = await directory.getResourceUrl(resourceId);

    expect(result.href).toBe(`${apiUrl.href}tests/test`);
    expect(axiosMock.get).toHaveBeenCalled();
  });
});
