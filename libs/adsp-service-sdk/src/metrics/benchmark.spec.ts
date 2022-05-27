import { Request } from 'express';
import { benchmark } from './benchmark';
import { REQ_BENCHMARK } from './types';

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
    }, 200);
  });
});
