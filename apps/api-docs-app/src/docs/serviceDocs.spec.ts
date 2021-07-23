import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createServiceDocs } from './serviceDocs';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('createServiceDocs', () => {
  const loggerMock = ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown) as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
  };

  it('can create ServiceDocs', () => {
    const result = createServiceDocs({
      logger: loggerMock,
      tokenProvider: tokenProviderMock,
      directory: directoryMock,
    });

    expect(result).toBeTruthy();
  });

  describe('ServiceDocs', () => {
    describe('getDocs', () => {
      it('can get docs from cache', async () => {
        const result = createServiceDocs({
          logger: loggerMock,
          tokenProvider: tokenProviderMock,
          directory: directoryMock,
        });

        const docs = {
          test: {
            service: {
              id: adspId`urn:ads:platform:test-service`,
              name: 'Test Service',
            },
            docs: {},
            url: 'http://test-service',
          },
        };
        cacheMock.mockReturnValueOnce(docs);

        const records = await result.getDocs();
        expect(records).toBe(docs);
      });

      it('can get from API on cache miss', async () => {
        const result = createServiceDocs({
          logger: loggerMock,
          tokenProvider: tokenProviderMock,
          directory: directoryMock,
        });

        const service = {
          service: 'test-service',
          version: 'v1',
          displayName: 'Test Service',
        };
        const docs = {
          openapi: '3.0.0',
        };
        cacheMock.mockReturnValueOnce(null);
        tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');

        axiosMock.get.mockResolvedValueOnce({ data: { results: [service] } });
        axiosMock.get.mockResolvedValueOnce({ data: docs });

        const records = await result.getDocs();
        expect(records['test-service'].service.name).toBe(service.displayName);
        expect(records['test-service'].docs).toBe(docs);
      });

      it('can handle error in API doc request', async () => {
        const result = createServiceDocs({
          logger: loggerMock,
          tokenProvider: tokenProviderMock,
          directory: directoryMock,
        });

        const service = {
          service: 'test-service',
          version: 'v1',
          displayName: 'Test Service',
        };
        cacheMock.mockReturnValueOnce(null);
        tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');

        axiosMock.get.mockResolvedValueOnce({ data: { results: [service] } });
        axiosMock.get.mockRejectedValueOnce(new Error('Something went terribly wrong.'));

        const records = await result.getDocs();
        expect(records).toBeTruthy();
        expect(records['test-service']).toBeFalsy();
      });
    });

    it('can ignore not openapi response', async () => {
      const result = createServiceDocs({
        logger: loggerMock,
        tokenProvider: tokenProviderMock,
        directory: directoryMock,
      });

      const service = {
        service: 'test-service',
        version: 'v1',
        displayName: 'Test Service',
      };
      cacheMock.mockReturnValueOnce(null);
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');

      axiosMock.get.mockResolvedValueOnce({ data: { results: [service] } });
      axiosMock.get.mockResolvedValueOnce({ data: 'this is wrong.' });

      const records = await result.getDocs();
      expect(records).toBeTruthy();
      expect(records['test-service']).toBeFalsy();
    });

    // Note: The service registration is hardcoded to creating v1 entries for now, so anything else is unexpected.
    it('can ignore not v1 registration', async () => {
      const result = createServiceDocs({
        logger: loggerMock,
        tokenProvider: tokenProviderMock,
        directory: directoryMock,
      });

      const service = {
        service: 'test-service',
        version: 'v2',
        displayName: 'Test Service',
      };
      cacheMock.mockReturnValueOnce(null);
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');

      axiosMock.get.mockResolvedValueOnce({ data: { results: [service] } });

      const records = await result.getDocs();
      expect(records).toBeTruthy();
      expect(records['test-service']).toBeFalsy();
    });
  });
});
