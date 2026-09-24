import { Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { getReportSection } from './reports';
import { ReportCatalog } from '../types';

describe('getReportSection', () => {
  const logger = { debug: jest.fn(), info: jest.fn() } as unknown as Logger;
  const now = new Date('2026-09-17T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const run = async (catalog: ReportCatalog, req: Record<string, unknown>) => {
    const handler = getReportSection(catalog, logger);
    const res = { json: jest.fn() } as unknown as Response;
    const next = jest.fn();
    await handler(req as unknown as Request, res, next);
    return { res, next };
  };

  it('returns the handler payload in the report envelope', async () => {
    const summary = jest.fn().mockResolvedValue({ pdfGenerated: 11 });
    const { res, next } = await run(
      { pdf: { summary } },
      {
        params: { serviceId: 'pdf', sectionId: 'summary' },
        query: { from: '2026-08-18', to: '2026-09-16', preset: 'last30Days' },
        headers: { authorization: 'Bearer tok' },
      }
    );

    expect(next).not.toHaveBeenCalled();
    expect(summary).toHaveBeenCalledWith({
      serviceId: 'pdf',
      sectionId: 'summary',
      period: { from: '2026-08-18', to: '2026-09-16' },
      token: 'Bearer tok',
    });
    expect(res.json).toHaveBeenCalledWith({
      serviceId: 'pdf',
      sectionId: 'summary',
      period: { from: '2026-08-18', to: '2026-09-16' },
      data: { pdfGenerated: 11 },
    });
  });

  it('404s when the service has no handler for that section', async () => {
    const { next } = await run(
      { pdf: { summary: jest.fn() } },
      {
        params: { serviceId: 'pdf', sectionId: 'trends' },
        query: { from: '2026-08-18', to: '2026-09-16' },
        headers: { authorization: 'Bearer tok' },
      }
    );

    expect(next.mock.calls[0][0].extra.statusCode).toBe(HttpStatusCodes.NOT_FOUND);
  });

  it('404s for an unknown service', async () => {
    const { next } = await run(
      { pdf: { summary: jest.fn() } },
      {
        params: { serviceId: 'form', sectionId: 'summary' },
        query: { from: '2026-08-18', to: '2026-09-16' },
        headers: { authorization: 'Bearer tok' },
      }
    );

    expect(next.mock.calls[0][0].extra.statusCode).toBe(HttpStatusCodes.NOT_FOUND);
  });

  it('rejects a missing bearer token', async () => {
    const { next } = await run(
      { pdf: { summary: jest.fn() } },
      {
        params: { serviceId: 'pdf', sectionId: 'summary' },
        query: { from: '2026-08-18', to: '2026-09-16' },
        headers: {},
      }
    );

    expect(next.mock.calls[0][0].extra.statusCode).toBe(HttpStatusCodes.UNAUTHORIZED);
  });
});
