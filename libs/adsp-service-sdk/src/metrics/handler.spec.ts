import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { createMetricsHandler, writeMetrics } from './handler';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('handler', () => {
  const serviceId = adspId`urn:ads:platform:test-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
    getResourceUrl: jest.fn(),
  };

  const valueUrl = new URL('https://value-service/value/v1/test-service/values/service-metrics');

  describe('createMetricsHandler', () => {
    it('can create handler', () => {
      const handler = createMetricsHandler(serviceId, loggerMock, tokenProviderMock, directoryMock);
      expect(handler).toBeTruthy();
    });
  });

  describe('writeMetrics', () => {
    beforeEach(() => {
      axiosMock.post.mockReset();
    });

    it('can write metrics', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: null });
      await writeMetrics(loggerMock, tokenProviderMock, valueUrl.href, {
        tenantId,
        method: 'GET',
        path: '/abc/123',
        responseTime: 300,
        benchmark: {
          timings: {},
          metrics: {
            'metric-a': 123,
          },
        },
      });

      expect(axiosMock.post).toHaveBeenCalledWith(
        valueUrl.href,
        expect.objectContaining({
          context: expect.objectContaining({
            method: 'GET',
            path: '/abc/123',
          }),
          value: expect.objectContaining({ responseTime: 300 }),
          metrics: expect.objectContaining({
            'GET:/abc/123:count': 1,
            'GET:/abc/123:response-time': 300,
            'total:count': 1,
            'total:response-time': 300,
            'GET:/abc/123:metric-a': 123,
          }),
        }),
        expect.any(Object)
      );
    });

    it('can catch error', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));
      await writeMetrics(loggerMock, tokenProviderMock, valueUrl.href, {
        tenantId,
        method: 'GET',
        path: '/abc/123',
        responseTime: 300,
        benchmark: {
          timings: {},
          metrics: {},
        },
      });

      expect(axiosMock.post).toHaveBeenCalled();
    });
  });
});
