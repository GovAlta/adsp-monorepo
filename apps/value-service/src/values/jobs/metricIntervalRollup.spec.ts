import { Logger } from 'winston';
import { advanceMetricInterval, createMetricIntervalRollupJob } from './metricIntervalRollup';
import { MetricIntervalDefinition } from '../metricIntervals';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

const definition: MetricIntervalDefinition = {
  interval: 'hourly',
  bucket: '1 hour',
  seedHours: 24,
  chunkHours: 24,
};

const createRepository = (coverage = null) => ({
  getMetricsWindow: jest.fn(),
  getCoverage: jest.fn().mockResolvedValue(coverage),
  refresh: jest.fn().mockResolvedValue(1),
});

const at = (iso: string) => new Date(iso);

describe('advanceMetricInterval', () => {
  const now = at('2026-03-10T12:00:00Z');
  const metricsWindow = { start: at('2026-01-01T00:00:00Z'), end: now };

  it('seeds coverage a chunk wide when the interval has never been rolled up', async () => {
    const repository = createRepository();

    await advanceMetricInterval(repository, definition, metricsWindow, now);

    expect(repository.refresh).toHaveBeenCalledTimes(1);
    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', {
      start: at('2026-03-09T12:00:00Z'),
      end: now,
    });
  });

  it('seeds from the first metric when metrics start inside the seed window', async () => {
    const repository = createRepository();
    const recentMetrics = { start: at('2026-03-10T06:00:00Z'), end: now };

    await advanceMetricInterval(repository, definition, recentMetrics, now);

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', {
      start: at('2026-03-10T06:00:00Z'),
      end: now,
    });
  });

  it('moves the forward edge from where coverage ended, so the window stays contiguous', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-01-01T00:00:00Z'),
      coveredTo: at('2026-03-10T11:00:00Z'),
    });

    await advanceMetricInterval(repository, definition, metricsWindow, now);

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', {
      start: at('2026-03-10T11:00:00Z'),
      end: now,
    });
  });

  it('caps a forward catch-up at one chunk', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-01-01T00:00:00Z'),
      coveredTo: at('2026-03-01T00:00:00Z'),
    });

    await advanceMetricInterval(repository, definition, metricsWindow, now);

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', {
      start: at('2026-03-01T00:00:00Z'),
      end: at('2026-03-02T00:00:00Z'),
    });
  });

  it('walks history backwards a chunk at a time, ending where coverage begins', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-02-01T00:00:00Z'),
      coveredTo: now,
    });

    await advanceMetricInterval(repository, definition, metricsWindow, now);

    expect(repository.refresh).toHaveBeenCalledTimes(1);
    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', {
      start: at('2026-01-31T00:00:00Z'),
      end: at('2026-02-01T00:00:00Z'),
    });
  });

  it('stops walking back once history is covered', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-01-01T00:00:00Z'),
      coveredTo: now,
    });

    await advanceMetricInterval(repository, definition, metricsWindow, now);

    expect(repository.refresh).not.toHaveBeenCalled();
  });

  it('does not read past the first metric when walking back', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-01-01T06:00:00Z'),
      coveredTo: now,
    });

    await advanceMetricInterval(repository, definition, metricsWindow, now);

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', {
      start: at('2026-01-01T00:00:00Z'),
      end: at('2026-01-01T06:00:00Z'),
    });
  });

  it('moves both edges in one pass when coverage is short at each end', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-02-01T00:00:00Z'),
      coveredTo: at('2026-03-10T11:00:00Z'),
    });

    await advanceMetricInterval(repository, definition, metricsWindow, now);

    expect(repository.refresh).toHaveBeenCalledTimes(2);
  });
});

describe('createMetricIntervalRollupJob', () => {
  it('does nothing when no metrics have been recorded', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue(null);

    const refreshed = await createMetricIntervalRollupJob(repository, logger, [definition])();

    expect(refreshed).toBe(0);
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  it('advances every configured interval and totals the rows refreshed', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue({
      start: at('2026-03-10T00:00:00Z'),
      end: at('2026-03-10T12:00:00Z'),
    });
    repository.refresh.mockResolvedValue(3);

    const refreshed = await createMetricIntervalRollupJob(repository, logger, [
      definition,
      { ...definition, interval: 'daily', bucket: '1 day' },
    ])(at('2026-03-10T12:00:00Z'));

    expect(refreshed).toBe(6);
    expect(repository.refresh).toHaveBeenCalledTimes(2);
  });
});
