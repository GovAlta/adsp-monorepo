import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import {
  advanceMetricInterval,
  createMetricIntervalRollupJob,
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

  // A replica that cannot take the lock leaves the run to the one that did, rather than repeating
  // work that is already in flight against the same rows.
  it('does nothing when another instance holds the lock', async () => {
    const repository = createRepository(null, false);

    const refreshed = await createMetricIntervalRollupJob(repository, logger, [definition])();

    expect(refreshed).toBe(0);
    expect(repository.getMetricsWindow).not.toHaveBeenCalled();
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  // Coverage is read and then extended from what was read, so the whole run has to be inside the
  // lock: two runs interleaving between those steps would advance from the same edge and leave a
  // window neither of them filled.
  it('reads and refreshes through the locked repository', async () => {
    const repository = createRepository();
    repository.getMetricsWindow.mockResolvedValue({
      start: at('2026-03-10T00:00:00Z'),
      end: at('2026-03-10T12:00:00Z'),
    });

    await createMetricIntervalRollupJob(repository, logger, [definition])(at('2026-03-10T12:00:00Z'));

    const [locked] = repository.withRollupLock.mock.calls[0];
    expect(locked).toEqual(expect.any(Function));
    expect(repository.refresh).toHaveBeenCalled();
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

    expect(repository.withRollupLock).toHaveBeenCalledTimes(1);
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

    expect(repository.withRollupLock).toHaveBeenCalledTimes(2);
  });

  // A run that throws must still clear the guard, or the pod stops rolling up until it restarts.
  it('releases the guard when a run fails', async () => {
    const repository = createRepository();
    repository.withRollupLock.mockRejectedValue(new Error('connection slots exhausted'));

    scheduleMetricIntervalRollupJob({ logger, repository, maxChunkHours: 24 });
    const job = scheduledJob();

    await expect(job()).rejects.toThrow('connection slots exhausted');
    await expect(job()).rejects.toThrow('connection slots exhausted');

    expect(repository.withRollupLock).toHaveBeenCalledTimes(2);
  });
});
