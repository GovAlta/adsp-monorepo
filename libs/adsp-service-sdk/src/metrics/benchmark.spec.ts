import { Request } from 'express';
import { benchmark, startBenchmark } from './benchmark';
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
});
