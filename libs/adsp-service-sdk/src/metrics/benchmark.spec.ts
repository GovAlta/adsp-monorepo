import { Request } from 'express';
import type { MeterProvider } from '@opentelemetry/api';
import { benchmark, initializeBenchmarkMetrics, startBenchmark } from './benchmark';
import { REQ_BENCHMARK } from './types';

describe('benchmark', () => {
  describe('benchmark', () => {
    it('can set metric value', () => {
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: {} },
      };

      benchmark(req as unknown as Request, 'test', 123);
      expect(req[REQ_BENCHMARK].metrics['test']).toBe(123);
    });

    it('can set timing', () => {
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: {} },
      };

      benchmark(req as unknown as Request, 'test');
      expect(req[REQ_BENCHMARK].timings['test']).toEqual(
        expect.arrayContaining([expect.any(Number), expect.any(Number)])
      );
    });

    it('can compute duration', (done) => {
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: {} },
      };

      benchmark(req as unknown as Request, 'test');

      setTimeout(() => {
        benchmark(req as unknown as Request, 'test');
        expect(req[REQ_BENCHMARK].metrics['test']).toBeGreaterThan(200);
        done();
      }, 205);
    });
  });

  describe('startBenchmark', () => {
    it('can compute duration', (done) => {
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: {} },
      };

      const end = startBenchmark(req as unknown as Request, 'test');

      setTimeout(() => {
        end();
        expect(req[REQ_BENCHMARK].metrics['test']).toBeGreaterThan(200);
        done();
      }, 205);
    });

    it('can sum multiple measures duration', (done) => {
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: { test: 100 } },
      };

      const end = startBenchmark(req as unknown as Request, 'test');

      setTimeout(() => {
        end();
        expect(req[REQ_BENCHMARK].metrics['test']).toBeGreaterThan(300);
        done();
      }, 205);
    });

    it('can handle no request benchmark context', () => {
      const req = {};

      const end = startBenchmark(req as unknown as Request, 'test');
      expect(() => end()).not.toThrow();
    });
  });

  describe('benchmark metric attributes', () => {
    const record = jest.fn();
    const createHistogram = jest.fn().mockReturnValue({ record });

    beforeAll(() => {
      initializeBenchmarkMetrics({ getMeter: () => ({ createHistogram }) } as unknown as MeterProvider);
    });

    beforeEach(() => {
      record.mockClear();
    });

    it('can create the histogram with boundaries covering the measured range', () => {
      expect(createHistogram).toHaveBeenCalledWith(
        'adsp.benchmark.duration',
        expect.objectContaining({
          advice: { explicitBucketBoundaries: [0.1, 0.5, 1, 2.5, 5, 10, 25, 50, 100, 250, 1000, 5000] },
        })
      );
    });

    it('can combine the tenant name and urn into one label', () => {
      const urn = 'urn:ads:platform:tenant-service:v2:/tenants/64d4eef5abc788a358dece8c';
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: {} },
        method: 'GET',
        baseUrl: '/form/v1',
        route: { path: '/forms' },
        tenant: { id: urn, name: 'Wildfire' },
      };

      startBenchmark(req as unknown as Request, 'get-tenant-time')();

      expect(record).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ 'adsp.tenant': `Wildfire (${urn})` })
      );
      expect(record).toHaveBeenCalledWith(
        expect.any(Number),
        expect.not.objectContaining({ 'adsp.tenant.id': expect.anything() })
      );
    });

    it('can label the route of a matched request', () => {
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: {} },
        method: 'GET',
        baseUrl: '/form/v1',
        route: { path: '/forms/:id' },
        path: '/forms/a6bf5c59-b56c-45a5-839d-6e38ac926748',
      };

      startBenchmark(req as unknown as Request, 'get-tenant-time')();

      expect(record).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ 'benchmark.name': 'get-tenant-time', 'http.route': '/form/v1/forms/:id' })
      );
    });

    it('can omit the route when the request has not matched one', () => {
      const req = {
        [REQ_BENCHMARK]: { timings: {}, metrics: {} },
        method: 'GET',
        baseUrl: '',
        path: '/form/v1/forms/a6bf5c59-b56c-45a5-839d-6e38ac926748',
      };

      startBenchmark(req as unknown as Request, 'get-tenant-time')();

      expect(record).toHaveBeenCalledWith(
        expect.any(Number),
        expect.not.objectContaining({ 'http.route': expect.anything() })
      );
    });
  });
});
