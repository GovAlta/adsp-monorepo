import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import {
  advanceEventResourcesBackward,
  advanceEventResourcesForward,
  boundEventResourceChunkHours,
  createEventResourceRollupJob,
  scheduleEventResourceRollupJob,
} from './eventResourceRollup';
import { eventResourceRollupSources } from '../serviceMetricRollupMappings';
import { EventResourceCoverage } from '../types';

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

const source = { namespace: 'pdf-service', names: ['pdf-generated'], contextKey: 'templateId' };
const at = (iso: string) => new Date(iso);
const DAY = 24;

const createRepository = (
  coverage: EventResourceCoverage | null = null,
  { locked = true, dataEnd = null as Date | null } = {},
) => {
  const repository = {
    getCoverage: jest.fn().mockResolvedValue(coverage),
    getEventLogEndBefore: jest.fn().mockResolvedValue(dataEnd),
    refresh: jest.fn().mockResolvedValue(1),
    countDistinct: jest.fn(),
    withRollupLock: jest.fn((work: (repository: unknown) => Promise<unknown>) =>
      locked ? work(repository) : Promise.resolve(null),
    ),
  };

  return repository;
};

const covered = (from: string, to: string): EventResourceCoverage => ({
  namespace: 'pdf-service',
  contextKey: 'templateId',
  coveredFrom: at(from),
  coveredTo: at(to),
});

describe('eventResourceRollupSources', () => {
  it('rolls up the resources the service rollup mappings name', () => {
    expect(eventResourceRollupSources.map(({ namespace, contextKey }) => `${namespace} ${contextKey}`)).toEqual([
      'pdf-service templateId',
      'form-service definitionId',
    ]);
  });
});

describe('boundEventResourceChunkHours', () => {
  it('prefers a week, one event log chunk', () => {
    expect(boundEventResourceChunkHours(Number.POSITIVE_INFINITY)).toBe(7 * DAY);
  });

  it('applies the configured cap', () => {
    expect(boundEventResourceChunkHours(48)).toBe(48);
  });

  // A window narrower than a day rolls up nothing, so coverage would never move.
  it('never cuts below one day', () => {
    expect(boundEventResourceChunkHours(6)).toBe(DAY);
  });
});

describe('advanceEventResourcesForward', () => {
  const now = at('2026-11-10T12:00:00Z');

  it('seeds a chunk of closed days when the source has never been rolled up', async () => {
    const repository = createRepository();

    await advanceEventResourcesForward(repository, source, 2 * DAY, now);

    expect(repository.refresh).toHaveBeenCalledWith(source, {
      start: at('2026-11-08T00:00:00Z'),
      end: at('2026-11-10T00:00:00Z'),
    });
  });

  it('moves the leading edge from where coverage ended, capped at a chunk', async () => {
    const repository = createRepository(covered('2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z'));

    await advanceEventResourcesForward(repository, source, 2 * DAY, now);

    expect(repository.refresh).toHaveBeenCalledWith(source, {
      start: at('2026-11-01T00:00:00Z'),
      end: at('2026-11-03T00:00:00Z'),
    });
  });

  it('does nothing once every closed day is covered', async () => {
    const repository = createRepository(covered('2026-10-01T00:00:00Z', '2026-11-10T00:00:00Z'));

    expect(await advanceEventResourcesForward(repository, source, 2 * DAY, at('2026-11-10T12:30:00Z'))).toBe(0);
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  // An event can reach the log after its day settled, from a retry or a delayed write.
  it('rolls the last two closed days up again on the first tick of each hour', async () => {
    const repository = createRepository(covered('2026-10-01T00:00:00Z', '2026-11-10T00:00:00Z'));

    await advanceEventResourcesForward(repository, source, 7 * DAY, at('2026-11-10T13:02:00Z'));
    expect(repository.refresh).toHaveBeenCalledWith(source, {
      start: at('2026-11-08T00:00:00Z'),
      end: at('2026-11-10T00:00:00Z'),
    });
  });

  it('keeps the revisit within a one-day chunk and within coverage', async () => {
    const repository = createRepository(covered('2026-11-09T12:00:00Z', '2026-11-10T00:00:00Z'));

    await advanceEventResourcesForward(repository, source, DAY, at('2026-11-10T13:02:00Z'));
    expect(repository.refresh).toHaveBeenCalledWith(source, {
      start: at('2026-11-09T12:00:00Z'),
      end: at('2026-11-10T00:00:00Z'),
    });
  });

  // An event written just after midnight can carry a timestamp from just before it.
  it('leaves a day open until it has settled', async () => {
    const repository = createRepository(covered('2026-10-01T00:00:00Z', '2026-11-09T00:00:00Z'));

    expect(await advanceEventResourcesForward(repository, source, 2 * DAY, at('2026-11-10T00:30:00Z'))).toBe(0);

    await advanceEventResourcesForward(repository, source, 2 * DAY, at('2026-11-10T01:00:00Z'));
    expect(repository.refresh).toHaveBeenCalledWith(source, {
      start: at('2026-11-09T00:00:00Z'),
      end: at('2026-11-10T00:00:00Z'),
    });
  });
});

describe('advanceEventResourcesBackward', () => {
  it('walks history back a chunk at a time, ending where coverage begins', async () => {
    const repository = createRepository(covered('2026-10-01T00:00:00Z', '2026-11-10T00:00:00Z'), {
      dataEnd: at('2026-10-08T00:00:00Z'),
    });

    await advanceEventResourcesBackward(repository, source, 2 * DAY);

    expect(repository.getEventLogEndBefore).toHaveBeenCalledWith(at('2026-10-01T00:00:00Z'));
    expect(repository.refresh).toHaveBeenCalledWith(source, {
      start: at('2026-09-29T00:00:00Z'),
      end: at('2026-10-01T00:00:00Z'),
    });
  });

  // Stray events years older than the rest of the log would otherwise take a step per chunk of
  // empty time to reach.
  it('crosses a span with no event log chunks in one step', async () => {
    const repository = createRepository(covered('2022-01-06T00:00:00Z', '2026-11-10T00:00:00Z'), {
      dataEnd: at('2012-04-26T00:00:00Z'),
    });

    await advanceEventResourcesBackward(repository, source, 2 * DAY);

    expect(repository.refresh).toHaveBeenCalledWith(source, {
      start: at('2012-04-24T00:00:00Z'),
      end: at('2022-01-06T00:00:00Z'),
    });
  });

  it('stops once nothing is stored below coverage', async () => {
    const repository = createRepository(covered('0000-12-28T00:00:00Z', '2026-11-10T00:00:00Z'));

    expect(await advanceEventResourcesBackward(repository, source, 2 * DAY)).toBe(0);
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  it('leaves a source that has never been rolled up to the forward pass', async () => {
    const repository = createRepository();

    expect(await advanceEventResourcesBackward(repository, source, 2 * DAY)).toBe(0);
    expect(repository.getEventLogEndBefore).not.toHaveBeenCalled();
  });
});

describe('createEventResourceRollupJob', () => {
  const now = at('2026-11-10T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('takes the lock once per source per direction so the work commits as it goes', async () => {
    const repository = createRepository(covered('2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z'), {
      dataEnd: at('2026-10-01T00:00:00Z'),
    });
    const otherSource = { namespace: 'form-service', names: ['form-created'], contextKey: 'definitionId' };

    const refreshed = await createEventResourceRollupJob(repository, logger, DAY, [source, otherSource])(now);

    expect(repository.withRollupLock).toHaveBeenCalledTimes(4);
    expect(refreshed).toBe(4);
  });

  it('advances nothing when another instance holds the lock', async () => {
    const repository = createRepository(null, { locked: false });

    expect(await createEventResourceRollupJob(repository, logger, DAY, [source])(now)).toBe(0);
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  it('keeps the leading edge when the backfill pass fails, and names the one that did', async () => {
    const repository = createRepository(covered('2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z'), {
      dataEnd: at('2026-10-01T00:00:00Z'),
    });
    repository.refresh.mockResolvedValueOnce(5).mockRejectedValueOnce(new Error('canceling statement'));

    const refreshed = await createEventResourceRollupJob(repository, logger, DAY, [source])(now);

    expect(refreshed).toBe(5);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('pdf-service templateId event resource rollup backward'),
      expect.anything(),
    );
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('1 pass(es) failed'), expect.anything());
  });
});

describe('scheduleEventResourceRollupJob', () => {
  const scheduleJob = schedule.scheduleJob as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('schedules the job every five minutes, offset from the interval rollups', () => {
    scheduleEventResourceRollupJob({ logger, repository: createRepository() as never, maxChunkHours: DAY });

    expect(scheduleJob).toHaveBeenCalledWith('2-59/5 * * * *', expect.any(Function));
  });

  it('skips a tick while the previous run is still in progress', async () => {
    let release: () => void;
    const repository = createRepository();
    // Only the first pass is held open; the rest of the run completes once it is released.
    repository.withRollupLock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve(0);
        }),
    );

    scheduleEventResourceRollupJob({ logger, repository: repository as never, maxChunkHours: DAY });
    const tick = scheduleJob.mock.calls[0][1] as () => Promise<void>;

    const first = tick();
    await tick();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('still in progress'), expect.anything());

    release();
    await first;
  });
});
