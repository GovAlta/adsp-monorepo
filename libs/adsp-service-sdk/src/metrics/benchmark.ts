import { Request } from 'express';
import { EndBenchmark, RequestBenchmark, REQ_BENCHMARK } from './types';

export function benchmark(req: Request, metric: string, value?: number): void {
  const benchmark: RequestBenchmark = req[REQ_BENCHMARK];
  if (benchmark) {
    // Record the value if this is just setting it; otherwise calculate timings.
    if (value) {
      benchmark.metrics[metric] = value;
    } else {
      const startAt = benchmark.timings[metric];
      if (startAt) {
        const [sec, nano] = process.hrtime(startAt);
        benchmark.metrics[metric] = sec * 1e3 + nano * 1e-6;
      } else {
        benchmark.timings[metric] = process.hrtime();
      }
    }
  }
}

export function startBenchmark(req: Request, metric: string): EndBenchmark {
  const benchmark: RequestBenchmark = req[REQ_BENCHMARK];
  if (benchmark) {
    const startAt = process.hrtime();
    return () => {
      const [sec, nano] = process.hrtime(startAt);
      const value = sec * 1e3 + nano * 1e-6;
      benchmark.metrics[metric] = (benchmark.metrics[metric] || 0) + value;
    };
  } else {
    return () => {
      // return a no-op in case there is no benchmark context.
    };
  }
}
