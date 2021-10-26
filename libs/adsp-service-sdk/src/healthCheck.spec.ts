import axios from 'axios';
import { Logger } from 'winston';
import { checkServiceHealth, createHealthCheck } from './healthCheck';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('healthCheck', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    cacheMock.mockReset();
    axiosMock.get.mockReset();
  });

  describe('checkServiceHealth', () => {
    it('can check health', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200 });
      const result = await checkServiceHealth(logger, new URL('http://test-co.org/health'));

      expect(result).toBeTruthy();
    });

    it('can return unhealthy for non-200', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 400 });
      const result = await checkServiceHealth(logger, new URL('http://test-co.org/health'));

      expect(result).toBeFalsy();
    });

    it('can return unhealthy for error', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Something went terribly wrong.'));
      const result = await checkServiceHealth(logger, new URL('http://test-co.org/health'));

      expect(result).toBeFalsy();
    });
  });

  describe('createHealthCheck', () => {
    const directoryMock = {
      getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-service'))),
      getResourceUrl: jest.fn(),
    };

    it('can create health check', () => {
      const healthCheck = createHealthCheck(
        logger,
        new URL('http://totally-real-access'),
        new URL('http://totally-real-directory'),
        directoryMock,
        {}
      );

      expect(healthCheck).toBeTruthy();
    });

    it('can check health from cache', async () => {
      const healthCheck = createHealthCheck(
        logger,
        new URL('http://totally-real-access'),
        new URL('http://totally-real-directory'),
        directoryMock,
        {}
      );

      const cached = {
        access: true,
        directory: true,
        tenant: true,
        configuration: true,
        event: false,
      };

      cacheMock.mockReturnValueOnce(cached);
      const results = await healthCheck();

      expect(results).toEqual(cached);
    });

    it('can check health', async () => {
      const healthCheck = createHealthCheck(
        logger,
        new URL('http://totally-real-access'),
        new URL('http://totally-real-directory'),
        directoryMock,
        {}
      );

      axiosMock.get.mockResolvedValue({ status: 200 });
      const { access, directory, tenant, configuration, event } = await healthCheck();

      expect(access).toBeTruthy();
      expect(directory).toBeTruthy();
      expect(tenant).toBeTruthy();
      expect(configuration).toBeTruthy();
      expect(event).toBeTruthy();
    });

    it('can exclude checks', async () => {
      const healthCheck = createHealthCheck(
        logger,
        new URL('http://totally-real-access'),
        new URL('http://totally-real-directory'),
        directoryMock,
        { event: true, directory: true }
      );

      axiosMock.get.mockResolvedValue({ status: 200 });
      const results = await healthCheck();

      expect(results.access).toBeTruthy();
      expect(results.tenant).toBeTruthy();
      expect(results.configuration).toBeTruthy();
      expect(Object.keys(results).includes('event')).toBeFalsy();
      expect(Object.keys(results).includes('directory')).toBeFalsy();
    });

    it('can ignore extraneous exclude', async () => {
      const healthCheck = createHealthCheck(
        logger,
        new URL('http://totally-real-access'),
        new URL('http://totally-real-directory'),
        directoryMock,
        { service: true }
      );

      axiosMock.get.mockResolvedValue({ status: 200 });
      const { access, directory, tenant, configuration, event } = await healthCheck();

      expect(access).toBeTruthy();
      expect(directory).toBeTruthy();
      expect(tenant).toBeTruthy();
      expect(configuration).toBeTruthy();
      expect(event).toBeTruthy();
    });
  });
});
