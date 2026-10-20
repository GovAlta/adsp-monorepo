import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { createLogger, transports } from 'winston';
import { createAuditMetrics } from './metrics';
import { FailedEventRepository } from './types';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { load } from 'js-yaml';

describe('audit metrics', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const repository: jest.Mocked<FailedEventRepository> = {
    list: jest.fn(),
    countOpen: jest.fn(),
    withReplayTransaction: jest.fn(),
  };
  let provider: MeterProvider;
  let reader: PeriodicExportingMetricReader;

  beforeEach(() => {
    jest.resetAllMocks();
    repository.countOpen.mockResolvedValue(0);
    reader = new PeriodicExportingMetricReader({
      exporter: new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE),
      exportIntervalMillis: 60000,
    });

    provider = new MeterProvider({ readers: [reader] });
  });

  afterEach(async () => {
    await provider.shutdown();
    jest.restoreAllMocks();
  });

  async function collect() {
    const { resourceMetrics } = await reader.collect();
    return resourceMetrics.scopeMetrics.flatMap(({ metrics }) => metrics);
  }

  it.each([0, 1, 12])('observes the durable open count %s, including a single row', async (count) => {
    repository.countOpen.mockResolvedValue(count);
    createAuditMetrics(provider.getMeter('audit-service'), repository, logger);

    const metrics = await collect();

    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.open')?.dataPoints).toEqual([
      expect.objectContaining({ value: count, attributes: {} }),
    ]);
  });

  it('recounts storage on each collection rather than keeping a process-local delta', async () => {
    repository.countOpen.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    createAuditMetrics(provider.getMeter('audit-service'), repository, logger);
    await collect();

    const metrics = await collect();

    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.open')?.dataPoints).toEqual([
      expect.objectContaining({ value: 0 }),
    ]);
  });

  it('counts parked events through the durability hook', async () => {
    const audit = createAuditMetrics(provider.getMeter('audit-service'), repository, logger);

    audit.recordParkedEvent();
    const metrics = await collect();

    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.events.parked')?.dataPoints).toEqual([
      expect.objectContaining({ value: 1, attributes: {} }),
    ]);
  });

  it.each(['ingest', 'replay'] as const)(
    'counts %s save failures without event or tenant labels',
    async (operation) => {
      const audit = createAuditMetrics(provider.getMeter('audit-service'), repository, logger);

      audit.recordWriteFailure(operation);
      const metrics = await collect();

      expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.write.failures')?.dataPoints).toEqual([
        expect.objectContaining({ value: 1, attributes: { operation } }),
      ]);
    },
  );

  it('does not report zero open events on a count failure', async () => {
    repository.countOpen.mockRejectedValue(new Error('Database unavailable'));
    const error = jest.spyOn(logger, 'error');
    createAuditMetrics(provider.getMeter('audit-service'), repository, logger);

    const metrics = await collect();

    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.open')?.dataPoints).toEqual([
      expect.objectContaining({ value: NaN }),
    ]);
    expect(error).toHaveBeenCalled();
  });

  it('does not reuse an old healthy count after collection fails', async () => {
    repository.countOpen.mockResolvedValueOnce(0).mockRejectedValue(new Error('Database unavailable'));
    createAuditMetrics(provider.getMeter('audit-service'), repository, logger);
    await collect();

    const metrics = await collect();

    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.open')?.dataPoints).toEqual([
      expect.objectContaining({ value: NaN }),
    ]);
    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.available')?.dataPoints).toEqual([
      expect.objectContaining({ value: 0 }),
    ]);
  });

  it.each([-1, NaN, 1.5])('reports count collection unavailable for invalid count %s', async (count) => {
    repository.countOpen.mockResolvedValue(count);
    createAuditMetrics(provider.getMeter('audit-service'), repository, logger);

    const metrics = await collect();

    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.available')?.dataPoints).toEqual([
      expect.objectContaining({ value: 0 }),
    ]);
  });

  it('exposes missing repository integration rather than a healthy zero count', async () => {
    createAuditMetrics(provider.getMeter('audit-service'), undefined, logger);

    const metrics = await collect();

    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.available')?.dataPoints).toEqual([
      expect.objectContaining({ value: 0 }),
    ]);
    expect(metrics.find(({ descriptor }) => descriptor.name === 'audit.failed.events.open')?.dataPoints).toEqual([
      expect.objectContaining({ value: NaN }),
    ]);
  });

  it('allows operation with telemetry disabled', () => {
    const metrics = createAuditMetrics(undefined, repository, logger);

    expect(() => {
      metrics.recordParkedEvent();
      metrics.recordWriteFailure('replay');
    }).not.toThrow();
  });
});

describe('audit alert configuration', () => {
  const template = load(
    readFileSync(
      resolve(__dirname, '..', '..', '..', '..', '.openshift', 'observability', 'observability-stack.yml'),
      'utf8',
    ),
  ) as { objects: { kind: string; data?: Record<string, string> }[] };
  const configMap = template.objects.find((object) => object.kind === 'ConfigMap' && object.data?.['prometheus.yml']);
  const prometheus = load(configMap.data['prometheus.yml']) as { rule_files: string[] };
  const alerts = load(configMap.data['audit-alerts.yml']) as {
    groups: { rules: { alert: string; expr: string; for?: string }[] }[];
  };
  const rules = alerts.groups.flatMap(({ rules }) => rules);

  it('loads audit rules from the mounted Prometheus config directory', () => {
    expect(prometheus.rule_files).toContain('/etc/prometheus/audit-alerts.yml');
  });

  it('alerts on any open row without summing replica counts or waiting for a duration', () => {
    const rule = rules.find(({ alert }) => alert === 'AuditOpenFailedEvents');

    expect({ expression: rule.expr, duration: rule.for }).toEqual({
      expression: 'max by (deployment_environment) (audit_failed_events_open) > 0',
      duration: undefined,
    });
  });

  it('warns when open-event count collection is unavailable', () => {
    const rule = rules.find(({ alert }) => alert === 'AuditFailedEventCountUnavailable');

    expect(rule.expr).toBe('min by (deployment_environment) (audit_failed_events_available) == 0');
  });
});
