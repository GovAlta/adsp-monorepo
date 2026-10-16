import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { createAuditJsonParser, validateWriteRequest } from './request-validation';

describe('audit request validation', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });

  function createApp() {
    const app = express();
    app.use(createAuditJsonParser());
    app.post('/events', validateWriteRequest, (_req, res) => res.sendStatus(HttpStatusCodes.NO_CONTENT));
    app.use(createErrorHandler(logger));
    return app;
  }

  it.each([1, 500])('accepts an envelope with %s events before individual validation', async (count) => {
    const payload = { events: Array(count).fill(null) };

    const response = await request(createApp()).post('/events').send(payload);

    expect(response.status).toBe(HttpStatusCodes.NO_CONTENT);
  });

  it.each([
    {},
    [],
    { events: 'not-an-array' },
    { events: [] },
    { events: Array(501).fill(null) },
    { events: [null], tenantId: 'case-team' },
  ])('rejects an invalid batch envelope %#', async (payload) => {
    const response = await request(createApp()).post('/events').send(payload);

    expect(response.status).toBe(HttpStatusCodes.BAD_REQUEST);
  });

  it('returns a clear error for malformed JSON', async () => {
    const response = await request(createApp())
      .post('/events')
      .set('Content-Type', 'application/json')
      .send('{"events": [');

    expect(response.body).toEqual({ errorMessage: 'Malformed JSON request body.' });
    expect(response.status).toBe(HttpStatusCodes.BAD_REQUEST);
  });
});
