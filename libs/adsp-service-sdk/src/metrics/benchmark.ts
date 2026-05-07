import { Request } from 'express';
import { metrics, trace } from '@opentelemetry/api';
import type { Histogram, MeterProvider } from '@opentelemetry/api';
import { EndBenchmark, RequestBenchmark, REQ_BENCHMARK } from './types';

const BENCHMARK_METRIC_ALLOWLIST = new Set([
  'operation-handler-time',
  'get-entity-time',
  'get-tenant-time',
  'get-configuration-time',
  'validation-time',
]);

// Benchmark histogram, initialized explicitly by initializeBenchmarkMetrics() to avoid race conditions.
let benchmarkDuration: Histogram | undefined;
let isExplicitlyInitialized = false;

/**
 * Initialize benchmark metrics with an explicit MeterProvider.
 * Call this during platform initialization to ensure the histogram is created
 * with the correct instrumented meter provider before any benchmarks are recorded.
 * Subsequent calls are no-ops if already explicitly initialized.
 * @param meterProvider The MeterProvider to use for benchmark instrumentation
 */
export function initializeBenchmarkMetrics(meterProvider: MeterProvider): void {
  if (!isExplicitlyInitialized) {
    const benchmarkMeter = meterProvider.getMeter('adsp-service-sdk');
    benchmarkDuration = benchmarkMeter.createHistogram('adsp.benchmark.duration', {
      description: 'Benchmark duration measurements recorded by ADSP request handlers.',
      unit: 'ms',
    });
    isExplicitlyInitialized = true;
  }
}

function getBenchmarkDurationHistogram(): Histogram {
  if (!benchmarkDuration) {
    // Fallback: if not explicitly initialized, try global provider (less reliable but handles edge cases).
    const benchmarkMeter = metrics.getMeter('adsp-service-sdk');
    benchmarkDuration = benchmarkMeter.createHistogram('adsp.benchmark.duration', {
      description: 'Benchmark duration measurements recorded by ADSP request handlers.',
      unit: 'ms',
    });
  }
  return benchmarkDuration;
}

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

  getBenchmarkDurationHistogram().record(value, getBenchmarkMetricAttributes(req, metric));
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
