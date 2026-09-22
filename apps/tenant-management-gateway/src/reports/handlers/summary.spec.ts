import { ValueServiceClient } from '../client';
import { EventMetrics } from '../types';
import { pdfSummarySource } from './pdf/summary';
import { avgMetric, createSummaryHandler, maxMetric, sumMetric, zeroSummary } from './summary';

const metricsFixture: EventMetrics = {
  'pdf-service:pdf-generation-queued:count': {
    name: 'pdf-service:pdf-generation-queued:count',
    values: [
      { interval: '2026-08-27T00:00:00.000Z', sum: '4', count: 4 },
      { interval: '2026-08-24T00:00:00.000Z', sum: '8', count: 8 },
      { interval: '2026-08-20T00:00:00.000Z', sum: '2', count: 2 },
      { interval: '2026-08-26T00:00:00.000Z', sum: '1', count: 1 },
    ],
  },
  'pdf-service:pdf-generated:count': {
    name: 'pdf-service:pdf-generated:count',
    values: [
      { interval: '2026-08-27T00:00:00.000Z', sum: '4', count: 4 },
      { interval: '2026-08-24T00:00:00.000Z', sum: '4', count: 4 },
      { interval: '2026-08-20T00:00:00.000Z', sum: '2', count: 2 },
      { interval: '2026-08-26T00:00:00.000Z', sum: '1', count: 1 },
    ],
  },
  'pdf-service:pdf-generation-failed:count': {
    name: 'pdf-service:pdf-generation-failed:count',
    values: [{ interval: '2026-08-24T00:00:00.000Z', sum: '4', count: 4 }],
  },
  'pdf-service:pdf-generation:duration': {
    name: 'pdf-service:pdf-generation:duration',
    values: [
      { interval: '2026-08-27T00:00:00.000Z', sum: '11', max: '3', count: 4 },
      { interval: '2026-08-26T00:00:00.000Z', sum: '3', max: '3', count: 1 },
      { interval: '2026-08-24T00:00:00.000Z', sum: '12', max: '4', count: 4 },
      { interval: '2026-08-20T00:00:00.000Z', sum: '6', max: '3', count: 2 },
    ],
  },
};

describe('metric aggregators', () => {
  it('sums count metrics', () => {
    expect(sumMetric(metricsFixture, 'pdf-service:pdf-generation-queued:count')).toBe(15);
    expect(sumMetric(metricsFixture, 'pdf-service:pdf-generated:count')).toBe(11);
    expect(sumMetric(metricsFixture, 'pdf-service:pdf-generation-failed:count')).toBe(4);
  });

  it('averages duration from sum/count', () => {
    expect(avgMetric(metricsFixture, 'pdf-service:pdf-generation:duration')).toBe(2.9);
  });

  it('takes the max duration', () => {
    expect(maxMetric(metricsFixture, 'pdf-service:pdf-generation:duration')).toBe(4);
  });

  it('returns 0 for a missing metric', () => {
    expect(sumMetric({}, 'missing')).toBe(0);
  });
});

describe('createSummaryHandler', () => {
  it('maps PDF fields from metrics and distinct templates in parallel', async () => {
    const client: ValueServiceClient = {
      readEventMetrics: jest.fn().mockResolvedValue(metricsFixture),
      countDistinctContext: jest.fn().mockResolvedValue(6),
    };
    const handler = createSummaryHandler(client, pdfSummarySource);

    const data = await handler({
      serviceId: 'pdf',
      sectionId: 'summary',
      period: { from: '2026-08-18', to: '2026-09-16' },
      token: 'Bearer t',
    });

    expect(data).toEqual({
      pdfRequested: 15,
      pdfGenerated: 11,
      pdfFailed: 4,
      unreconciled: 4,
      generationDuration: 2.9,
      generationDurationMax: 4,
      templatesUsed: 6,
    });
    expect(client.readEventMetrics).toHaveBeenCalledTimes(1);
    expect(client.countDistinctContext).toHaveBeenCalledTimes(1);
  });

  it('returns zeros when the effective period is empty', async () => {
    const client: ValueServiceClient = {
      readEventMetrics: jest.fn(),
      countDistinctContext: jest.fn(),
    };
    const handler = createSummaryHandler(client, pdfSummarySource);

    await expect(
      handler({
        serviceId: 'pdf',
        sectionId: 'summary',
        period: { from: '2026-09-17', to: '2026-09-16' },
        token: 'Bearer t',
      })
    ).resolves.toEqual(zeroSummary(pdfSummarySource));
    expect(client.readEventMetrics).not.toHaveBeenCalled();
  });
});
