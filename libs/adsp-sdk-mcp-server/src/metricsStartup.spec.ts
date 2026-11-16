jest.mock('@opentelemetry/exporter-metrics-otlp-http', () => {
  const { AggregationTemporality, InMemoryMetricExporter } = jest.requireActual('@opentelemetry/sdk-metrics');
  return {
    OTLPMetricExporter: jest.fn(() => new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE)),
  };
});

jest.mock('@opentelemetry/sdk-metrics', () => {
  const actual = jest.requireActual('@opentelemetry/sdk-metrics');
  return {
    ...actual,
    PeriodicExportingMetricReader: jest.fn((options) => new actual.PeriodicExportingMetricReader(options)),
  };
});

import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { hostname } from 'os';
import { getMetrics, startMetricsFromEnv, StartedMetrics } from './metrics';

const mockExporter = OTLPMetricExporter as unknown as jest.Mock;
const mockReader = PeriodicExportingMetricReader as unknown as jest.Mock;

describe('startMetricsFromEnv', () => {
  const noopMetrics = getMetrics();
  let started: StartedMetrics | undefined;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await started?.shutdown();
    started = undefined;
    consoleError.mockRestore();
    jest.clearAllMocks();
  });

  it('creates no exporter and returns undefined when OTEL_EXPORTER_OTLP_ENDPOINT is unset', async () => {
    started = await startMetricsFromEnv({});

    expect(started).toBeUndefined();
    expect(mockExporter).not.toHaveBeenCalled();
    expect(mockReader).not.toHaveBeenCalled();
    expect(getMetrics()).toBe(noopMetrics);
  });

  it('treats a blank endpoint as unset', async () => {
    started = await startMetricsFromEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: '  ' });

    expect(started).toBeUndefined();
    expect(mockExporter).not.toHaveBeenCalled();
  });

  it('exports to ${endpoint}/v1/metrics and trims a trailing slash', async () => {
    started = await startMetricsFromEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318/' });

    expect(started).toBeDefined();
    expect(mockExporter).toHaveBeenCalledWith({ url: 'http://collector.test:4318/v1/metrics' });
    expect(getMetrics()).not.toBe(noopMetrics);
  });

  it('exports every 60 seconds by default', async () => {
    started = await startMetricsFromEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318' });

    expect(mockReader).toHaveBeenCalledWith(expect.objectContaining({ exportIntervalMillis: 60_000 }));
  });

  it('uses OTEL_METRIC_EXPORT_INTERVAL when set', async () => {
    started = await startMetricsFromEnv({
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318',
      OTEL_METRIC_EXPORT_INTERVAL: '2000',
    });

    expect(mockReader).toHaveBeenCalledWith(expect.objectContaining({ exportIntervalMillis: 2000 }));
    expect(started).toBeDefined();
    expect(getMetrics()).not.toBe(noopMetrics);
  });

  it('keeps the export timeout within a short export interval', async () => {
    started = await startMetricsFromEnv({
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318',
      OTEL_METRIC_EXPORT_INTERVAL: '2000',
    });

    expect(mockReader).toHaveBeenCalledWith(expect.objectContaining({ exportTimeoutMillis: 2000 }));
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('Metrics disabled'));
  });

  it('restores the no-op recorder on shutdown', async () => {
    started = await startMetricsFromEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318' });
    await started?.shutdown();
    started = undefined;

    expect(getMetrics()).toBe(noopMetrics);
  });

  it('flushes recorded metrics to the exporter on shutdown', async () => {
    started = await startMetricsFromEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318' });
    getMetrics().recordToolCall('search_adsp_docs', 0.01);
    await started?.shutdown();
    started = undefined;

    const exporter = mockExporter.mock.results[0].value;
    const names = exporter
      .getMetrics()
      .flatMap((resourceMetrics) => resourceMetrics.scopeMetrics)
      .flatMap((scope) => scope.metrics)
      .map((metric) => metric.descriptor.name);
    expect(names).toContain('mcp.tool.duration');
  });

  it('tags metrics with this instance so replicas stay separate series', async () => {
    started = await startMetricsFromEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318' });
    getMetrics().recordToolCall('search_adsp_docs', 0.01);
    await started?.shutdown();
    started = undefined;

    const [resourceMetrics] = mockExporter.mock.results[0].value.getMetrics();
    expect(resourceMetrics.resource.attributes).toEqual(
      expect.objectContaining({ 'service.name': 'adsp-sdk-mcp-server', 'service.instance.id': hostname() })
    );
  });

  it('logs and continues without metrics when the exporter throws', async () => {
    mockExporter.mockImplementationOnce(() => {
      throw new Error('bad endpoint');
    });

    started = await startMetricsFromEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.test:4318' });

    expect(started).toBeUndefined();
    expect(getMetrics()).toBe(noopMetrics);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('Metrics disabled: bad endpoint');
  });
});
