import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import {
  advanceMetricInterval,
  createMetricIntervalRollupJob,
  resolveAvailableWindow,
  scheduleMetricIntervalRollupJob,
} from './metricIntervalRollup';
import { MetricIntervalDefinition } from '../metricIntervals';

jest.mock('node-schedule', () => ({
  scheduleJob: jest.fn(),
}));

jest.mock('@abgov/adsp-service-sdk', () => ({
  instrumentJob: jest.fn((_name: string, job: () => Promise<void>) => job),
}));

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

const definition: MetricIntervalDefinition = {
  interval: 'hourly',
  bucket: '1 hour',
  source: null,
  bucketHours: 1,
  seedHours: 24,
  chunkHours: 24,
};

const createRepository = (coverage = null, locked = true) => {
  const repository = {
    getMetricsWindow: jest.fn(),
    getCoverage: jest.fn().mockResolvedValue(coverage),
    refresh: jest.fn().mockResolvedValue(1),
    withRollupLock: jest.fn((work: (repository: unknown) => Promise<unknown>) =>
      locked ? work(repository) : Promise.resolve(null),
    ),
  };

  return repository;
};

const at = (iso: string) => new Date(iso);

describe('advanceMetricInterval', () => {
  const now = at('2026-03-10T12:00:00Z');
  const metricsWindow = { start: at('2026-01-01T00:00:00Z'), end: now };

  it('seeds coverage a chunk wide when the interval has never been rolled up', async () => {
    const repository = createRepository();

    await advanceMetricInterval(repository, definition, { start: metricsWindow.start, end: now });

    expect(repository.refresh).toHaveBeenCalledTimes(1);
    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', null, {
      start: at('2026-03-09T12:00:00Z'),
      end: now,
    });
  });

  it('seeds from the first metric when metrics start inside the seed window', async () => {
    const repository = createRepository();
    const recentMetrics = { start: at('2026-03-10T06:00:00Z'), end: now };

    await advanceMetricInterval(repository, definition, { start: recentMetrics.start, end: now });

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', null, {
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

    await advanceMetricInterval(repository, definition, { start: metricsWindow.start, end: now });

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', null, {
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

    await advanceMetricInterval(repository, definition, { start: metricsWindow.start, end: now });

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', null, {
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

    await advanceMetricInterval(repository, definition, { start: metricsWindow.start, end: now });

    expect(repository.refresh).toHaveBeenCalledTimes(1);
    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', null, {
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

    await advanceMetricInterval(repository, definition, { start: metricsWindow.start, end: now });

    expect(repository.refresh).not.toHaveBeenCalled();
  });

  it('does not read past the first metric when walking back', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-01-01T06:00:00Z'),
      coveredTo: now,
    });

    await advanceMetricInterval(repository, definition, { start: metricsWindow.start, end: now });

    expect(repository.refresh).toHaveBeenCalledWith('hourly', '1 hour', null, {
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

    await advanceMetricInterval(repository, definition, { start: metricsWindow.start, end: now });

    expect(repository.refresh).toHaveBeenCalledTimes(2);
  });
});

describe('resolveAvailableWindow', () => {
  const metricsWindow = { start: at('2026-01-01T00:00:00Z'), end: at('2026-03-10T12:00:00Z') };
  const now = at('2026-03-10T12:00:00Z');

  // The finest interval reads the raw table, so it can advance right up to now.
  it('lets a raw-reading interval run to now', async () => {
    const repository = createRepository();

    expect(await resolveAvailableWindow(repository, definition, metricsWindow, now)).toEqual({
      start: metricsWindow.start,
      end: now,
    });
    expect(repository.getCoverage).not.toHaveBeenCalled();
  });

  // A composed interval cannot roll up buckets its source has not built yet, so its window is the
  // source's coverage rather than the raw metrics span.
  it('bounds a composed interval by its source coverage', async () => {
    const repository = createRepository({
      interval: 'hourly',
      coveredFrom: at('2026-02-01T00:00:00Z'),
      coveredTo: at('2026-03-01T00:00:00Z'),
    });

    const available = await resolveAvailableWindow(
      repository,
      { ...definition, interval: 'daily', bucket: '1 day', source: 'hourly' },
      metricsWindow,
      now,
    );

    expect(repository.getCoverage).toHaveBeenCalledWith('hourly');
    expect(available).toEqual({ start: at('2026-02-01T00:00:00Z'), end: at('2026-03-01T00:00:00Z') });
  });

  it('returns null when the source has never been rolled up', async () => {
    const repository = createRepository();

    const available = await resolveAvailableWindow(
      repository,
      { ...definition, interval: 'daily', bucket: '1 day', source: 'hourly' },
      metricsWindow,
      now,
    );

    expect(available).toBeNull();
  });
});

describe('createMetricIntervalRollupJob', () => {
  const metricsWindow = { start: at('2026-03-10T00:00:00Z'), end: at('2026-03-10T12:00:00Z') };

  it('does nothing when no metrics have been recorded', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue(null);

    const refreshed = await createMetricIntervalRollupJob(repository, logger, [definition])();

    expect(refreshed).toBe(0);
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  // A replica that cannot take the lock leaves that interval to the one that did, rather than
  // repeating work already in flight against the same rows.
  it('advances nothing when another instance holds the lock', async () => {
    const repository = createRepository(null, false);
    repository.getMetricsWindow.mockResolvedValue(metricsWindow);

    const refreshed = await createMetricIntervalRollupJob(repository, logger, [definition])();

    expect(refreshed).toBe(0);
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  // Coverage is per interval, so that is the unit the lock has to cover. Taking it once for the
  // whole run meant one interval's statement timeout rolled back every interval before it, and the
  // job committed nothing at all.
  it('takes the lock once per interval so the work commits as it goes', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue(metricsWindow);

    await createMetricIntervalRollupJob(repository, logger, [
      definition,
      { ...definition, interval: 'daily', bucket: '1 day' },
    ])(at('2026-03-10T12:00:00Z'));

    expect(repository.withRollupLock).toHaveBeenCalledTimes(2);
  });

  // An interval whose source is empty has nothing to aggregate; it waits rather than failing.
  it('skips an interval whose source has no coverage yet', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue(metricsWindow);

    const refreshed = await createMetricIntervalRollupJob(repository, logger, [
      { ...definition, interval: 'daily', bucket: '1 day', source: 'hourly' },
    ])(at('2026-03-10T12:00:00Z'));

    expect(refreshed).toBe(0);
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  // The coarse intervals read the most history and run last, so letting one failure end the run
  // would be indistinguishable from the whole job being broken.
  it('carries on after an interval fails, and names the one that did', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue(metricsWindow);
    repository.withRollupLock
      .mockImplementationOnce(() => Promise.reject(new Error('canceling statement due to statement timeout')))
      .mockImplementationOnce((work: (repository: unknown) => Promise<unknown>) => work(repository));

    const refreshed = await createMetricIntervalRollupJob(repository, logger, [
      definition,
      { ...definition, interval: 'daily', bucket: '1 day' },
    ])(at('2026-03-10T12:00:00Z'));

    expect(refreshed).toBe(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to advance the hourly metric interval rollup'),
      expect.anything(),
    );
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

describe('scheduleMetricIntervalRollupJob', () => {
  beforeEach(() => {
    (schedule.scheduleJob as jest.Mock).mockClear();
  });

  const scheduledJob = () => (schedule.scheduleJob as jest.Mock).mock.calls[0][1] as () => Promise<void>;

  it('schedules the job on a five minute cron', () => {
    scheduleMetricIntervalRollupJob({ logger, repository: createRepository(), maxChunkHours: 24 });

    expect((schedule.scheduleJob as jest.Mock).mock.calls[0][0]).toBe('*/5 * * * *');
  });

  // The cron fires whether or not the last run finished. Without this the runs pile up, each one
  // holding a connection, which is what emptied the database's connection slots in dev.
  it('skips a tick while the previous run is still in progress', async () => {
    const repository = createRepository();
    let release: () => void;
    repository.getMetricsWindow.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ start: at('2026-03-10T00:00:00Z'), end: at('2026-03-10T12:00:00Z') });
      }),
    );

    scheduleMetricIntervalRollupJob({ logger, repository, maxChunkHours: 24 });
    const job = scheduledJob();

    const first = job();
    await job();

    expect(repository.getMetricsWindow).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalled();

    release();
    await first;
  });

  it('accepts a further tick once the previous run has finished', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue(null);

    scheduleMetricIntervalRollupJob({ logger, repository, maxChunkHours: 24 });
    const job = scheduledJob();

    await job();
    await job();

    expect(repository.getMetricsWindow).toHaveBeenCalledTimes(2);
  });

  // A run that throws must still clear the guard, or the pod stops rolling up until it restarts.
  it('releases the guard when a run fails', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockRejectedValue(new Error('connection slots exhausted'));

    scheduleMetricIntervalRollupJob({ logger, repository, maxChunkHours: 24 });
    const job = scheduledJob();

    await expect(job()).rejects.toThrow('connection slots exhausted');
    await expect(job()).rejects.toThrow('connection slots exhausted');

    expect(repository.getMetricsWindow).toHaveBeenCalledTimes(2);
  });
});
