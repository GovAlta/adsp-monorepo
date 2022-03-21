import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createServiceDocs } from './serviceDocs';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
    keys = jest.fn(() => ['platform']);
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;
const id = adspId`urn:ads:platform:test-service`;
const tenantId = adspId`urn:ads:autotest:test-service`;

describe('createServiceDocs', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
    getResourceUrl: jest.fn(),
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
          'urn:ads:platform:test-service': {
            service: {
              id,
              name: 'Test service',
            },
            docs: {},
            url: 'http://test-service',
          },
        };
        cacheMock.mockReturnValueOnce(docs);
        const records = await result.getDocs(id);
        expect(records).toStrictEqual(docs);
      });

      it('can get from API on cache miss', async () => {
        const result = createServiceDocs({
          logger: loggerMock,
          tokenProvider: tokenProviderMock,
          directory: directoryMock,
        });

        const directory = {
          'urn:ads:autotest:test-service': 'http://mock-url',
        };

        const metadata = {
          _links: {
            doc: 'http://mock-url',
          },
        };

        const docs = {
          openapi: '3.0.0',
        };
        cacheMock.mockReturnValueOnce({});
        tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');
        axiosMock.get.mockResolvedValueOnce({ data: directory });
        axiosMock.get.mockResolvedValueOnce({ data: metadata });
        axiosMock.get.mockResolvedValueOnce({ data: docs });

        const docsInCache = {
          'urn:ads:autotest:test-service': {
            service: {
              id,
              name: 'Test service',
            },
            docs: {},
            url: 'http://test-service',
          },
        };
        cacheMock.mockReturnValueOnce(docsInCache);
        const records = await result.getDocs(tenantId);
        expect(records).toStrictEqual(docsInCache);
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
          displayName: 'Test service',
        };
        cacheMock.mockReturnValueOnce(null);
        tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');

        axiosMock.get.mockResolvedValueOnce({ data: { results: [service] } });
        axiosMock.get.mockRejectedValueOnce(new Error('Something went terribly wrong.'));

        const records = await result.getDocs(id);
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
        displayName: 'Test service',
      };
      cacheMock.mockReturnValueOnce(null);
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');

      axiosMock.get.mockResolvedValueOnce({ data: { results: [service] } });
      axiosMock.get.mockResolvedValueOnce({ data: 'this is wrong.' });

      const records = await result.getDocs(id);
      console.log(records);
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
        displayName: 'Test service',
      };
      cacheMock.mockReturnValueOnce(null);
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test');

      axiosMock.get.mockResolvedValueOnce({ data: { results: [service] } });

      const records = await result.getDocs(id);
      expect(records).toBeTruthy();
      expect(records['test-service']).toBeFalsy();
    });
  });
});
