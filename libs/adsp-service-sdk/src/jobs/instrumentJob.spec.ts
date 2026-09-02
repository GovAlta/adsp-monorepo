import { context as otelContext, trace as otelTrace, ROOT_CONTEXT, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import type { Context, MeterProvider } from '@opentelemetry/api';
import { Logger } from 'winston';
import { initializeJobMetrics, instrumentJob } from './instrumentJob';

describe('instrumentJob', () => {
  const record = jest.fn();
  const createHistogram = jest.fn().mockReturnValue({ record });

  const logger: Logger = { debug: jest.fn(), info: jest.fn(), error: jest.fn() } as unknown as Logger;

  let span: { setStatus: jest.Mock; recordException: jest.Mock; setAttribute: jest.Mock; end: jest.Mock };
  let startActiveSpan: jest.Mock;
  let getTracerSpy: jest.SpyInstance;
  let withSpy: jest.SpyInstance;

  beforeAll(() => {
    initializeJobMetrics({ getMeter: () => ({ createHistogram }) } as unknown as MeterProvider);
  });

  beforeEach(() => {
    record.mockClear();
    (logger.error as jest.Mock).mockClear();
    span = { setStatus: jest.fn(), recordException: jest.fn(), setAttribute: jest.fn(), end: jest.fn() };
    startActiveSpan = jest.fn((_name, _options, callback) => callback(span));
    getTracerSpy = jest.spyOn(otelTrace, 'getTracer').mockReturnValue({ startActiveSpan } as never);
    withSpy = jest.spyOn(otelContext, 'with').mockImplementation(((_ctx: unknown, fn: () => unknown) => fn()) as never);
  });

  afterEach(() => {
    getTracerSpy.mockRestore();
    withSpy.mockRestore();
  });

  it('can create the histogram with boundaries covering a job run', () => {
    expect(createHistogram).toHaveBeenCalledWith(
      'adsp.job.duration',
      expect.objectContaining({
        unit: 'ms',
        advice: {
          explicitBucketBoundaries: [100, 500, 1000, 5000, 15000, 30000, 60000, 300000, 900000, 1800000],
        },
      }),
    );
  });

  it('can span a successful run and record it as success', async () => {
    const work = jest.fn().mockResolvedValue(undefined);

    await instrumentJob('form-lock', work, { logger })();

    expect(work).toHaveBeenCalled();
    expect(startActiveSpan).toHaveBeenCalledWith(
      'job form-lock',
      expect.objectContaining({ kind: SpanKind.INTERNAL, attributes: { 'adsp.job.name': 'form-lock' } }),
      expect.any(Function),
    );
    expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    expect(span.end).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(expect.any(Number), {
      'adsp.job.name': 'form-lock',
      'adsp.job.result': 'success',
    });
  });

  it('can run the job in a root context so it is its own trace', async () => {
    // The ambient context has to be non-root for this to prove anything: with nothing active,
    // otelContext.active() returns ROOT_CONTEXT itself and the assertion cannot tell the two apart.
    const ambient = { _ambient: true } as unknown as Context;
    const activeSpy = jest.spyOn(otelContext, 'active').mockReturnValue(ambient);

    await instrumentJob('form-lock', jest.fn(), { logger })();

    expect(withSpy).toHaveBeenCalledWith(ROOT_CONTEXT, expect.any(Function));
    expect(withSpy).not.toHaveBeenCalledWith(ambient, expect.any(Function));

    activeSpy.mockRestore();
  });

  it('can swallow a thrown job so the scheduler does not see a rejection', async () => {
    const work = jest.fn().mockRejectedValue(new Error('job blew up'));

    await expect(instrumentJob('form-lock', work, { logger })()).resolves.toBeUndefined();

    expect(span.recordException).toHaveBeenCalled();
    expect(span.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ code: SpanStatusCode.ERROR, message: 'job blew up' }),
    );
    expect(logger.error).toHaveBeenCalled();
    expect(span.end).toHaveBeenCalledTimes(1);
  });

  it('can record a failed run as error', async () => {
    await instrumentJob('form-delete', jest.fn().mockRejectedValue(new Error('nope')), { logger })();

    expect(record).toHaveBeenCalledWith(expect.any(Number), {
      'adsp.job.name': 'form-delete',
      'adsp.job.result': 'error',
    });
  });

  it('can pass the span to the job so a run can report how much work it did', async () => {
    await instrumentJob('form-lock', (jobSpan) => {
      jobSpan.setAttribute('adsp.job.items', 12);
    })();

    expect(span.setAttribute).toHaveBeenCalledWith('adsp.job.items', 12);
  });

  it('can put caller attributes on the span but not on the metric labels', async () => {
    const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/64d4eef5abc788a358dece8c';

    await instrumentJob('thread-cleanup', jest.fn(), { logger, attributes: { 'adsp.tenant.id': tenantId } })();

    expect(startActiveSpan).toHaveBeenCalledWith(
      'job thread-cleanup',
      expect.objectContaining({ attributes: { 'adsp.tenant.id': tenantId, 'adsp.job.name': 'thread-cleanup' } }),
      expect.any(Function),
    );
    // A per-tenant metric label would multiply the series by the tenant count.
    expect(record).toHaveBeenCalledWith(expect.any(Number), {
      'adsp.job.name': 'thread-cleanup',
      'adsp.job.result': 'success',
    });
  });

  it('can keep the job name out of the caller attributes it is given', async () => {
    await instrumentJob('thread-cleanup', jest.fn(), { attributes: { 'adsp.job.name': 'spoofed' } })();

    expect(startActiveSpan.mock.calls[0][1].attributes['adsp.job.name']).toBe('thread-cleanup');
  });
});
