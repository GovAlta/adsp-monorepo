import { adspId } from '@abgov/adsp-service-sdk';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { ServiceDirectoryImpl } from './directory';
import { DirectoryRepository } from './repository';

describe('directory', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    getDirectories: jest.fn(),
  };

  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.getDirectories.mockClear();
    cacheMock.get.mockClear();
    cacheMock.set.mockClear();
  });

  it('can be created', () => {
    const directory = new ServiceDirectoryImpl(loggerMock, repositoryMock as unknown as DirectoryRepository);
    expect(directory).toBeTruthy();
  });

  describe('getServiceUrl', () => {
    it('can return right service url for service', async () => {
      const directoryData = {
        services: [{ namespace: 'platform', service: 'test-service', host: 'https://chat.adsp-dev.gov.ab.ca/api/' }],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directoryData);

      const directory = new ServiceDirectoryImpl(
        loggerMock,
        repositoryMock as unknown as DirectoryRepository,
        cacheMock as unknown as NodeCache
      );

      const serviceId = adspId`urn:ads:platform:test-service`;
      const result = await directory.getServiceUrl(serviceId);
      expect(result.href).toEqual(directoryData.services[0].host);
      expect(cacheMock.set).toHaveBeenCalledWith(serviceId.toString(), expect.any(URL));
    });

    it('can return falsy if service not found', async () => {
      const directoryData = {
        services: [{ namespace: 'platform', service: 'test-service', host: 'https://chat.adsp-dev.gov.ab.ca/api/' }],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directoryData);

      const directory = new ServiceDirectoryImpl(
        loggerMock,
        repositoryMock as unknown as DirectoryRepository,
        cacheMock as unknown as NodeCache
      );

      const serviceId = adspId`urn:ads:platform:test-service-2`;
      const result = await directory.getServiceUrl(serviceId);
      expect(result).toBeFalsy();
    });

    it('can return falsy on repository error', async () => {
      repositoryMock.getDirectories.mockRejectedValueOnce(new Error('oh noes!'));

      const directory = new ServiceDirectoryImpl(
        loggerMock,
        repositoryMock as unknown as DirectoryRepository,
        cacheMock as unknown as NodeCache
      );

      const serviceId = adspId`urn:ads:platform:test-service-2`;
      const result = await directory.getServiceUrl(serviceId);
      expect(result).toBeFalsy();
    });

    it('can return service url from cache', async () => {
      const url = new URL('https://chat.adsp-dev.gov.ab.ca/api/');
      cacheMock.get.mockReturnValueOnce(url);

      const directory = new ServiceDirectoryImpl(
        loggerMock,
        repositoryMock as unknown as DirectoryRepository,
        cacheMock as unknown as NodeCache
      );

      const serviceId = adspId`urn:ads:platform:test-service`;
      const result = await directory.getServiceUrl(serviceId);
      expect(result).toBe(url);
    });
  });

  describe('getResourceUrl', () => {
    it('can return the resource URL', async () => {
      const directoryData = {
        services: [
          {
            namespace: 'platform',
            service: 'test-service:v1',
            host: 'https://chat.adsp-dev.gov.ab.ca/v1',
          },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValue(directoryData);

      const directory = new ServiceDirectoryImpl(
        loggerMock,
        repositoryMock as unknown as DirectoryRepository,
        cacheMock as unknown as NodeCache
      );

      const resourceId = adspId`urn:ads:platform:test-service:v1:/job`;
      const resourceUrl = await directory.getResourceUrl(resourceId);

      expect(resourceUrl.href).toBe('https://chat.adsp-dev.gov.ab.ca/v1/job');
      expect(cacheMock.set).toHaveBeenCalledWith(resourceId.toString(), expect.any(URL));
    });

    it('can return service url from cache', async () => {
      const url = new URL('https://chat.adsp-dev.gov.ab.ca/api/');
      cacheMock.get.mockReturnValueOnce(url);

      const directory = new ServiceDirectoryImpl(
        loggerMock,
        repositoryMock as unknown as DirectoryRepository,
        cacheMock as unknown as NodeCache
      );

      const resourceId = adspId`urn:ads:platform:test-service:v1:/job`;
      const resourceUrl = await directory.getResourceUrl(resourceId);

      expect(resourceUrl).toBe(url);
    });
  });
});
