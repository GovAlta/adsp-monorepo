import {
  AggregationTemporality,
  DataPoint,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

export interface MetricsTestKit {
  provider: MeterProvider;
  collect(): Promise<void>;
  points(name: string): DataPoint<unknown>[];
  shutdown(): Promise<void>;
}

export function createMetricsTestKit(): MetricsTestKit {
  const exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
  const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });
  const provider = new MeterProvider({ readers: [reader] });

  return {
    provider,
    collect: () => reader.forceFlush(),
    points(name) {
      const latest = exporter.getMetrics().at(-1);
      const metric = latest?.scopeMetrics.flatMap((scope) => scope.metrics).find((m) => m.descriptor.name === name);
      return (metric?.dataPoints ?? []) as DataPoint<unknown>[];
    },
    shutdown: () => provider.shutdown(),
  };
}

export function histogramCount(point: DataPoint<unknown>): number {
  return (point.value as { count: number }).count;
}
