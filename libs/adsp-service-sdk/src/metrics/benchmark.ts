import { Request } from 'express';
import { metrics, trace } from '@opentelemetry/api';
import { EndBenchmark, RequestBenchmark, REQ_BENCHMARK } from './types';

const BENCHMARK_METRIC_ALLOWLIST = new Set([
  'operation-handler-time',
  'get-entity-time',
  'get-tenant-time',
  'get-configuration-time',
  'validation-time',
]);

const benchmarkMeter = metrics.getMeter('adsp-service-sdk');
const benchmarkDuration = benchmarkMeter.createHistogram('adsp.benchmark.duration', {
  description: 'Benchmark duration measurements recorded by ADSP request handlers.',
  unit: 'ms',
});

function getBenchmarkMetricAttributes(req: Request, metric: string): Record<string, string> {
  const route = req.route?.path ? `${req.baseUrl || ''}${req.route.path}` : `${req.baseUrl || ''}${req.path || ''}`;
  const attributes: Record<string, string> = { 'benchmark.name': metric };

  if (req.method) {
    attributes['http.request.method'] = req.method;
  }
  if (route) {
    attributes['http.route'] = route;
  }

  return attributes;
}

function recordBenchmarkDurationMetric(req: Request, metric: string, value: number): void {
  if (!BENCHMARK_METRIC_ALLOWLIST.has(metric) || !Number.isFinite(value)) {
    return;
  }

  benchmarkDuration.record(value, getBenchmarkMetricAttributes(req, metric));
}

/**
 * @deprecated Value service benchmark recording is deprecated. Benchmark timings are now recorded as OpenTelemetry
 * span events when tracing is enabled. The value service write path will be removed in a future release.
 */
export function benchmark(req: Request, metric: string, value?: number): void {
  const benchmark: RequestBenchmark = req[REQ_BENCHMARK];
  if (benchmark) {
    // Record the value if this is just setting it; otherwise calculate timings.
    if (value) {
      benchmark.metrics[metric] = value;
      trace.getActiveSpan()?.addEvent(`adsp.benchmark.${metric}`, { 'benchmark.value': value });
    } else {
      const startAt = benchmark.timings[metric];
      if (startAt) {
        const [sec, nano] = process.hrtime(startAt);
        const duration = sec * 1e3 + nano * 1e-6;
        benchmark.metrics[metric] = duration;
        recordBenchmarkDurationMetric(req, metric, duration);
        trace.getActiveSpan()?.addEvent(`adsp.benchmark.${metric}`, { 'benchmark.duration_ms': duration });
      } else {
        benchmark.timings[metric] = process.hrtime();
        trace.getActiveSpan()?.addEvent(`adsp.benchmark.${metric}.start`);
      }
    }
  }
}

/**
 * @deprecated Value service benchmark recording is deprecated. Benchmark timings are now recorded as OpenTelemetry
 * span events when tracing is enabled. The value service write path will be removed in a future release.
 */
export function startBenchmark(req: Request, metric: string): EndBenchmark {
  const benchmark: RequestBenchmark = req[REQ_BENCHMARK];
  if (benchmark) {
    const startAt = process.hrtime();
    const span = trace.getActiveSpan();
    span?.addEvent(`adsp.benchmark.${metric}.start`);
    return () => {
      const [sec, nano] = process.hrtime(startAt);
      const value = sec * 1e3 + nano * 1e-6;
      benchmark.metrics[metric] = (benchmark.metrics[metric] || 0) + value;
      recordBenchmarkDurationMetric(req, metric, value);
      trace.getActiveSpan()?.addEvent(`adsp.benchmark.${metric}`, { 'benchmark.duration_ms': value });
    };
  } else {
    return () => {
      // return a no-op in case there is no benchmark context.
    };
  }
}
