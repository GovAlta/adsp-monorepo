import axios from 'axios';
import { Request, Response } from 'express';
import * as responseTime from 'response-time';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { createMetricsHandler, writeMetrics } from './handler';
import { benchmark } from './benchmark';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('response-time');
const responseTimeMock = responseTime as jest.MockedFunction<typeof responseTime>;

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
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://value-service/value/v1'))),
    getResourceUrl: jest.fn(),
  };

  const valueUrl = new URL('https://value-service/value/v1/test-service/values/service-metrics');

  beforeEach(() => {
    responseTimeMock.mockClear();
  });

  describe('createMetricsHandler', () => {
    it('can create handler', async () => {
      responseTimeMock.mockReturnValueOnce((req, res, next) => next());
      const handler = await createMetricsHandler(serviceId, loggerMock, tokenProviderMock, directoryMock);
      expect(handler).toBeTruthy();
    });

    it('can handle request', async () => {
      const req = { tenant: { id: tenantId } };
      const res = {};
      const next = jest.fn();

      responseTimeMock.mockImplementationOnce((fn) => (req, res, _next) => fn(req, res, 123));
      const handler = await createMetricsHandler(serviceId, loggerMock, tokenProviderMock, directoryMock);
      handler(req as unknown as Request, res as Response, next);
    });

    it('can handle request with user tenant context', async () => {
      const req = { user: { tenantId } };
      const res = {};
      const next = jest.fn();

      responseTimeMock.mockImplementationOnce((fn) => (req, res, _next) => fn(req, res, 123));
      const handler = await createMetricsHandler(serviceId, loggerMock, tokenProviderMock, directoryMock);
      handler(req as unknown as Request, res as Response, next);
    });

    it('can handle request with static tenant context', async () => {
      const req = { user: { tenantId } };
      const res = {};
      const next = jest.fn();

      responseTimeMock.mockImplementationOnce((fn) => (req, res, _next) => fn(req, res, 123));
      const handler = await createMetricsHandler(serviceId, loggerMock, tokenProviderMock, directoryMock, tenantId);
      handler(req as unknown as Request, res as Response, next);
    });

    it('can handle request with benchmark metric', async () => {
      const req = { user: { tenantId } };
      const res = {};
      const next = jest.fn();

      responseTimeMock.mockImplementationOnce((fn) => (req, res, _next) => {
        benchmark(req, 'test', 321);
        fn(req, res, 123);
      });
      const handler = await createMetricsHandler(serviceId, loggerMock, tokenProviderMock, directoryMock, tenantId);
      handler(req as unknown as Request, res as Response, next);
    });
  });

  describe('writeMetrics', () => {
    beforeEach(() => {
      axiosMock.post.mockReset();
    });

    it('can write metrics', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: null });

      const method = 'GET';
      const path = '/abc/123';
      const metrics = {
        'metric-a': 123,
      };
      const time = 300;
      await writeMetrics(serviceId, directoryMock, loggerMock, tokenProviderMock, {
        [`${tenantId}`]: [
          {
            timestamp: new Date(),
            correlationId: `${method}:${path}`,
            tenantId: tenantId.toString(),
            context: {
              method,
              path,
            },
            value: {
              ...metrics,
              responseTime: time,
            },
            metrics: {
              ...Object.entries(metrics).reduce(
                (values, [name, value]) => ({
                  ...values,
                  [`total:${name}`]: value,
                  [`${method}:${path}:${name}`]: value,
                }),
                {}
              ),
              [`total:count`]: 1,
              [`${method}:${path}:count`]: 1,
              [`total:response-time`]: time,
              [`${method}:${path}:response-time`]: time,
            },
          },
        ],
      });

      expect(axiosMock.post).toHaveBeenCalledWith(
        valueUrl.href,
        expect.arrayContaining([
          expect.objectContaining({
            context: expect.objectContaining({
              method: 'GET',
              path: '/abc/123',
            }),
            value: expect.objectContaining({ responseTime: 300, 'metric-a': 123 }),
            metrics: expect.objectContaining({
              'GET:/abc/123:count': 1,
              'GET:/abc/123:response-time': 300,
              'total:count': 1,
              'total:response-time': 300,
              'GET:/abc/123:metric-a': 123,
            }),
          }),
        ]),
        expect.objectContaining({
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });

    it('can write metrics for multiple tenants', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: null });
      const tenant2Id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`;
      const tenant3Id = adspId`urn:ads:platform:tenant-service:v2:/tenants/test3`;

      const method = 'GET';
      const path = '/abc/123';
      await writeMetrics(serviceId, directoryMock, loggerMock, tokenProviderMock, {
        [`${tenantId}`]: [
          {
            timestamp: new Date(),
            correlationId: `${method}:${path}`,
            tenantId: tenantId.toString(),
            context: {
              method,
              path,
            },
            value: {
              responseTime: 123,
            },
          },
        ],
        [`${tenant2Id}`]: [
          {
            timestamp: new Date(),
            correlationId: `${method}:${path}`,
            tenantId: tenantId.toString(),
            context: {
              method,
              path,
            },
            value: {
              responseTime: 321,
            },
          },
        ],
        [`${tenant3Id}`]: null,
      });

      expect(axiosMock.post).toHaveBeenCalledWith(
        valueUrl.href,
        expect.arrayContaining([
          expect.objectContaining({
            value: expect.objectContaining({
              responseTime: 123,
            }),
          }),
        ]),
        expect.objectContaining({
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );

      expect(axiosMock.post).toHaveBeenCalledWith(
        valueUrl.href,
        expect.arrayContaining([
          expect.objectContaining({
            value: expect.objectContaining({
              responseTime: 321,
            }),
          }),
        ]),
        expect.objectContaining({
          params: expect.objectContaining({ tenantId: tenant2Id.toString() }),
        })
      );
    });

    it('can catch error', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));

      const method = 'GET';
      const path = '/abc/123';
      const metrics = {
        'metric-a': 123,
      };
      const time = 300;
      await writeMetrics(serviceId, directoryMock, loggerMock, tokenProviderMock, {
        [`${tenantId}`]: [
          {
            timestamp: new Date(),
            correlationId: `${method}:${path}`,
            tenantId: tenantId.toString(),
            context: {
              method,
              path,
            },
            value: {
              ...metrics,
              responseTime: time,
            },
            metrics: {
              ...Object.entries(metrics).reduce(
                (values, [name, value]) => ({
                  ...values,
                  [`total:${name}`]: value,
                  [`${method}:${path}:${name}`]: value,
                }),
                {}
              ),
              [`total:count`]: 1,
              [`${method}:${path}:count`]: 1,
              [`total:response-time`]: time,
              [`${method}:${path}:response-time`]: time,
            },
          },
        ],
      });

      expect(axiosMock.post).toHaveBeenCalled();
    });
  });
});
