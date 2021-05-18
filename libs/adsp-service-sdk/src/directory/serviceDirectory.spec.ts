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
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  const tokenProvider: TokenProvider = {
    getAccessToken: jest.fn(),
  };

  it('can create ServiceDirectory', () => {
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);
    expect(directory).toBeTruthy();
  });

  it('can retrieve service URL from cache', async (done) => {
    const cached = 'https://test-service';
    const serviceId = adspId`urn:ads:test-sandbox:test-service`;
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValue(cached);
    const result = await directory.getServiceUrl(serviceId);
    expect(result).toBe(cached);

    done();
  });

  it('can retrieve API URL from cache', async (done) => {
    const cached = 'https://test-service';
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;
    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValue(cached);
    const result = await directory.getServiceUrl(apiId);
    expect(result).toBe(cached);

    done();
  });

  it('can retrieve API URL from directory', async (done) => {
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;
    const apiUrl = 'https://test-service';

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(apiUrl);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [{ urn: `${adspId}`, url: apiUrl }] }));
    const result = await directory.getServiceUrl(apiId);

    expect(result).toBe(apiUrl);
    expect(axiosMock.get).toHaveBeenCalled();

    done();
  });

  it('can throw for missing entry', async (done) => {
    const apiId = adspId`urn:ads:test-sandbox:test-service:v1`;

    const directory = new ServiceDirectoryImpl(logger, new URL('https://directory'), tokenProvider);

    cacheMock.mockReturnValueOnce(null);
    cacheMock.mockReturnValueOnce(null);
    axiosMock.get.mockReturnValueOnce(Promise.resolve({ data: [] }));

    await expect(directory.getServiceUrl(apiId)).rejects.toThrowError(/^Failed to find directory entry for /);
    expect(axiosMock.get).toHaveBeenCalled();

    done();
  });
});
