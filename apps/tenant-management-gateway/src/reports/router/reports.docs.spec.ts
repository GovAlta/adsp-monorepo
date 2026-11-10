import { createErrorHandler, UnauthorizedError } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ValueServiceClient } from '../client';
import { createReportCatalog } from '../handlers';
import { createReportsRouter } from './reports';

// Verifies the parameters and responses documented in reports.swagger.yml by sending requests through the reports
// router as mounted in main.ts, with the real report catalog and error handler.
describe('reports router documented behaviour', () => {
  const documented = createDocumentedResponseRecorder(join(__dirname, 'reports.swagger.yml'));
  const path = '/api/tenant/v1/reports';
  const token = 'Bearer eyJhbGciOiJSUzI1NiJ9.test.signature';

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const valueClientMock = {
    readEventMetrics: jest.fn(),
    countDistinctContext: jest.fn(),
  };

  function createApp(): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(
      '/api/tenant/v1',
      createReportsRouter({
        logger: loggerMock,
        catalog: createReportCatalog(valueClientMock as unknown as ValueServiceClient),
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    valueClientMock.readEventMetrics.mockResolvedValue({
      'pdf-service:pdf-generation-queued:count': {
        name: 'pdf-service:pdf-generation-queued:count',
        values: [{ interval: '2025-01-01T00:00:00.000Z', sum: '15' }],
      },
      'pdf-service:pdf-generated:count': {
        name: 'pdf-service:pdf-generated:count',
        values: [{ interval: '2025-01-01T00:00:00.000Z', sum: '11' }],
      },
      'pdf-service:pdf-generation-failed:count': {
        name: 'pdf-service:pdf-generation-failed:count',
        values: [{ interval: '2025-01-01T00:00:00.000Z', sum: '4' }],
      },
      'pdf-service:pdf-generation:duration': {
        name: 'pdf-service:pdf-generation:duration',
        values: [{ interval: '2025-01-01T00:00:00.000Z', sum: '31.9', count: '11', max: '4' }],
      },
    });
    valueClientMock.countDistinctContext.mockResolvedValue(6);
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /api/tenant/v1/reports/{serviceId}/{sectionId}', () => {
    it('returns the PDF summary for the period', async () => {
      const res = await request(createApp())
        .get(`${path}/pdf/summary`)
        .query({ from: '2025-01-01', to: '2025-01-31', preset: 'custom' })
        .set('Authorization', token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        serviceId: 'pdf',
        sectionId: 'summary',
        period: { from: '2025-01-01', to: '2025-01-31' },
        data: {
          pdfRequested: 15,
          pdfGenerated: 11,
          pdfFailed: 4,
          unreconciled: 4,
          generationDuration: 2.9,
          generationDurationMax: 4,
          templatesUsed: 6,
        },
      });
      expect(valueClientMock.readEventMetrics).toHaveBeenCalledWith(token, 'pdf-service', '2025-01-01', '2025-01-31');
    });

    it('returns zeros when the period has no completed days', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(createApp())
        .get(`${path}/pdf/summary`)
        .query({ from: today, to: today })
        .set('Authorization', token);

      expect(res.status).toBe(200);
      expect(res.body.data.pdfRequested).toBe(0);
      expect(res.body.data.templatesUsed).toBe(0);
      expect(valueClientMock.readEventMetrics).not.toHaveBeenCalled();
    });

    it('returns 400 when from is missing', async () => {
      const res = await request(createApp())
        .get(`${path}/pdf/summary`)
        .query({ to: '2025-01-31' })
        .set('Authorization', token);

      expect(res.status).toBe(400);
    });

    it('returns 400 when a date is not yyyy-mm-dd', async () => {
      const res = await request(createApp())
        .get(`${path}/pdf/summary`)
        .query({ from: '01/01/2025', to: '2025-01-31' })
        .set('Authorization', token);

      expect(res.status).toBe(400);
    });

    it('returns 400 when serviceId is longer than 50 characters', async () => {
      const res = await request(createApp())
        .get(`${path}/${'a'.repeat(51)}/summary`)
        .query({ from: '2025-01-01', to: '2025-01-31' })
        .set('Authorization', token);

      expect(res.status).toBe(400);
    });

    it('returns 400 when a date is not a real calendar date', async () => {
      const res = await request(createApp())
        .get(`${path}/pdf/summary`)
        .query({ from: '2025-02-30', to: '2025-03-31' })
        .set('Authorization', token);

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('from and to must be valid calendar dates.');
    });

    it('returns 400 when from is after to', async () => {
      const res = await request(createApp())
        .get(`${path}/pdf/summary`)
        .query({ from: '2025-02-01', to: '2025-01-31' })
        .set('Authorization', token);

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('from must be on or before to.');
    });

    it('returns 401 without a bearer token', async () => {
      const res = await request(createApp()).get(`${path}/pdf/summary`).query({ from: '2025-01-01', to: '2025-01-31' });

      expect(res.status).toBe(401);
      expect(res.body.errorMessage).toBe('Bearer token is required.');
    });

    it('returns 401 when value-service rejects the token', async () => {
      valueClientMock.readEventMetrics.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized to read report data.'),
      );

      const res = await request(createApp())
        .get(`${path}/pdf/summary`)
        .query({ from: '2025-01-01', to: '2025-01-31' })
        .set('Authorization', token);

      expect(res.status).toBe(401);
      expect(res.body.errorMessage).toBe('Not authorized to read report data.');
    });

    it('returns 404 for a section the service does not offer', async () => {
      const res = await request(createApp())
        .get(`${path}/pdf/trends`)
        .query({ from: '2025-01-01', to: '2025-01-31' })
        .set('Authorization', token);

      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toBe("report section with ID 'pdf/trends' could not be found.");
    });

    it('returns 404 for an unknown service', async () => {
      const res = await request(createApp())
        .get(`${path}/form/summary`)
        .query({ from: '2025-01-01', to: '2025-01-31' })
        .set('Authorization', token);

      expect(res.status).toBe(404);
    });
  });
});
