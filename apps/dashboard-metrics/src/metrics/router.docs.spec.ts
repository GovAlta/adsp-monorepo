import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createMetricsRouter } from './router';

// Verifies the responses documented in router.swagger.yml by sending requests through the metrics router as mounted
// in the service, with the real error handler.
describe('metrics router documented behaviour', () => {
  const documented = createDocumentedResponseRecorder(join(__dirname, 'router.swagger.yml'));
  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const repositoryMock = { isConnected: jest.fn(), writeMetrics: jest.fn(), readMetrics: jest.fn() };

  function createApp() {
    const app = express();
    app.use(documented.middleware);
    app.use('/metrics/v1', createMetricsRouter({ repository: repositoryMock }));
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  it('returns the metrics of the interval', async () => {
    const metrics = { logins: 10, tenants: [] };
    repositoryMock.readMetrics.mockResolvedValueOnce(metrics);

    const res = await request(createApp()).get('/metrics/v1/metrics/2026-11-08T00:00:00.000Z');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(metrics);
    expect(repositoryMock.readMetrics).toHaveBeenCalledWith('2026-11-08T00:00:00.000Z');
  });

  it('returns null when no metrics were collected for the interval', async () => {
    repositoryMock.readMetrics.mockResolvedValueOnce(null);

    const res = await request(createApp()).get('/metrics/v1/metrics/2026-01-01T00:00:00.000Z');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});
