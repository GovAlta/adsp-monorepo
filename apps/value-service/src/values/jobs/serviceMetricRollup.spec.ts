import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import { ServiceMetricRollupRepository } from '../repository';
import { ServiceMetricRollup } from '../types';
import {
  createServiceMetricRollupJob,
  getDays,
  getTrailingCompletedDayRange,
  scheduleServiceMetricRollupJob,
} from './serviceMetricRollup';

jest.mock('node-schedule', () => ({
  scheduleJob: jest.fn(),
}));

jest.mock('@abgov/adsp-service-sdk', () => ({
  instrumentJob: jest.fn((_name: string, job: () => Promise<void>) => job),
}));

describe('service metric rollup job', () => {
  const logger = {
    info: jest.fn(),
  } as unknown as Logger;

  const mapping = {
    service: 'pdf-service',
    initiated: { namespace: 'pdf-service', name: 'pdf-generation-queued' },
    succeeded: { namespace: 'pdf-service', name: 'pdf-generated' },
  };

  const rollup: ServiceMetricRollup = {
    day: new Date('2026-08-23T00:00:00.000Z'),
    tenant: 'autotest',
    service: 'pdf-service',
    initiated: 4,
    succeeded: 3,
    failure_events: null,
    unreconciled: 1,
    duration_sum: null,
    duration_count: null,
    duration_max: null,
    distinct_resources: null,
  };

  const repository = {
    hasRollups: jest.fn(),
    getHistoricalRollupRange: jest.fn(),
    getKnownTenantServices: jest.fn(),
    readRollup: jest.fn(),
    upsertRollups: jest.fn(),
  } as jest.Mocked<ServiceMetricRollupRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.getKnownTenantServices.mockResolvedValue([{ tenant: 'autotest', service: 'pdf-service' }]);
    repository.readRollup.mockResolvedValue(rollup);
    repository.upsertRollups.mockResolvedValue();
  });

  it('calculates a trailing range of completed days', () => {
    expect(getTrailingCompletedDayRange(3, new Date('2026-08-24T15:30:00.000Z'))).toEqual({
      start: new Date('2026-08-21T00:00:00.000Z'),
      end: new Date('2026-08-23T00:00:00.000Z'),
    });
  });

  it('returns each day in an inclusive range', () => {
    expect(getDays(new Date('2026-08-21T18:30:00.000Z'), new Date('2026-08-23T00:00:00.000Z'))).toEqual([
      new Date('2026-08-21T00:00:00.000Z'),
      new Date('2026-08-22T00:00:00.000Z'),
      new Date('2026-08-23T00:00:00.000Z'),
    ]);
  });

  it('stores one rollup for each known tenant service and day', async () => {
    const job = createServiceMetricRollupJob(repository, logger, [mapping]);

    const count = await job({
      start: new Date('2026-08-23T00:00:00.000Z'),
      end: new Date('2026-08-24T00:00:00.000Z'),
    });

    expect(count).toBe(2);
    expect(repository.readRollup).toHaveBeenCalledTimes(2);
    expect(repository.readRollup).toHaveBeenCalledWith(new Date('2026-08-23T00:00:00.000Z'), 'autotest', mapping);
    expect(repository.readRollup).toHaveBeenCalledWith(new Date('2026-08-24T00:00:00.000Z'), 'autotest', mapping);
    expect(repository.upsertRollups).toHaveBeenCalledWith([rollup, rollup]);
  });

  it('skips storing rollups when there are no known tenant services', async () => {
    repository.getKnownTenantServices.mockResolvedValue([]);
    const job = createServiceMetricRollupJob(repository, logger, [mapping]);

    const count = await job({
      start: new Date('2026-08-23T00:00:00.000Z'),
      end: new Date('2026-08-23T00:00:00.000Z'),
    });

    expect(count).toBe(0);
    expect(repository.readRollup).not.toHaveBeenCalled();
    expect(repository.upsertRollups).not.toHaveBeenCalled();
  });

  it('runs startup backfill when no rollups exist', async () => {
    repository.hasRollups.mockResolvedValue(false);
    repository.getHistoricalRollupRange.mockResolvedValue({
      start: new Date('2026-08-23T00:00:00.000Z'),
      end: new Date('2026-08-23T00:00:00.000Z'),
    });

    await scheduleServiceMetricRollupJob({
      logger,
      repository,
      trailingDays: 3,
      backfillOnStartup: true,
    });

    expect(repository.upsertRollups).toHaveBeenCalledWith([rollup]);
  });

  it('schedules the trailing completed days rollup', async () => {
    repository.hasRollups.mockResolvedValue(true);

    await scheduleServiceMetricRollupJob({
      logger,
      repository,
      trailingDays: 2,
      backfillOnStartup: true,
    });

    const scheduledJob = (schedule.scheduleJob as jest.Mock).mock.calls[0][1] as () => Promise<void>;
    await scheduledJob();

    expect(repository.upsertRollups).toHaveBeenCalled();
  });
});
