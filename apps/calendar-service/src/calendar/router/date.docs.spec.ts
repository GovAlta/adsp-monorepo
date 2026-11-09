import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { CalendarRepository } from '../repository';
import { createDateRouter } from './date';

// Verifies the responses documented in date.swagger.yml by sending requests through the router as mounted in the
// service (under /calendar/v1, then the error handler).
describe('date router documented behaviour', () => {
  const documented = createDocumentedResponseRecorder(join(__dirname, 'date.swagger.yml'));

  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const repositoryMock = { getDate: jest.fn(), getDates: jest.fn() };

  const remembranceDay = {
    id: 20261111,
    date: new Date('2026-11-11T00:00:00.000Z'),
    dayOfWeek: 3,
    isWeekend: false,
    isHoliday: true,
    isBusinessDay: false,
    holiday: 'Remembrance Day',
    isInLieuOfDay: false,
  };

  function createApp(): Express {
    const app = express();
    app.use(documented.middleware);
    app.use('/calendar/v1', createDateRouter({ repository: repositoryMock as unknown as CalendarRepository }));
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /calendar/v1/dates', () => {
    it('responds 200 with a page of dates matching the criteria, without authentication', async () => {
      repositoryMock.getDates.mockResolvedValueOnce({ results: [remembranceDay], page: { size: 1 } });
      const criteria = { min: 20260101, max: 20261231, isHoliday: true };

      const res = await request(createApp())
        .get('/calendar/v1/dates')
        .query({ top: '50', criteria: JSON.stringify(criteria) });

      expect(res.status).toBe(200);
      expect(res.body.results[0]).toMatchObject({ id: 20261111, holiday: 'Remembrance Day' });
      expect(repositoryMock.getDates).toHaveBeenCalledWith(50, undefined, criteria);
    });
  });

  describe('GET /calendar/v1/dates/{id}', () => {
    it('responds 200 with the date', async () => {
      repositoryMock.getDate.mockResolvedValueOnce(remembranceDay);

      const res = await request(createApp()).get('/calendar/v1/dates/20261111');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 20261111, isBusinessDay: false });
    });

    it('responds 400 for an ID outside the supported range', async () => {
      const res = await request(createApp()).get('/calendar/v1/dates/19991231');

      expect(res.status).toBe(400);
      expect(repositoryMock.getDate).not.toHaveBeenCalled();
    });

    it('responds 404 when the date is not found', async () => {
      repositoryMock.getDate.mockResolvedValueOnce(null);

      const res = await request(createApp()).get('/calendar/v1/dates/20591231');

      expect(res.status).toBe(404);
    });
  });
});
