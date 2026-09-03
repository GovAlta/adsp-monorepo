import { Knex } from 'knex';
import { TimescaleServiceMetricRollupRepository } from './serviceMetricRollup';
import { ServiceMetricRollupMapping } from '../types';

type BuilderResult = Record<string, unknown> | Record<string, unknown>[] | null;

function createBuilder(result: BuilderResult) {
  const builder = {
    first: jest.fn(() => Promise.resolve(result)),
    min: jest.fn(() => builder),
    max: jest.fn(() => builder),
    sum: jest.fn(() => builder),
    count: jest.fn(() => builder),
    countDistinct: jest.fn(() => builder),
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    onConflict: jest.fn(() => builder),
    merge: jest.fn(() => Promise.resolve()),
    where: jest.fn((criteria?: ((value: typeof builder) => void) | Record<string, unknown>) => {
      if (typeof criteria === 'function') {
        criteria(builder);
      }
      return builder;
    }),
    whereIn: jest.fn(() => builder),
    whereNotNull: jest.fn(() => builder),
    whereRaw: jest.fn(() => builder),
    orWhere: jest.fn(() => builder),
    orWhereRaw: jest.fn(() => builder),
    distinct: jest.fn(() => Promise.resolve(result)),
  };

  return builder;
}

function createKnex(results: BuilderResult[]) {
  const builders = results.map(createBuilder);
  const knex = jest.fn(() => builders.shift()) as jest.Mock & {
    raw: jest.Mock;
    fn: { now: jest.Mock };
  };
  knex.raw = jest.fn((sql: string, bindings?: unknown[]) => ({ sql, bindings }));
  knex.fn = {
    now: jest.fn(() => 'now'),
  };

  return {
    knex: knex as unknown as Knex,
    builders,
    mock: knex,
  };
}

describe('TimescaleServiceMetricRollupRepository', () => {
  const day = new Date('2026-08-23T00:00:00.000Z');

  beforeEach(() => {
    jest.useRealTimers();
  });

  it('can check if rollups exist', async () => {
    const { knex } = createKnex([{ day: '2026-08-23' }]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await expect(repository.hasRollups()).resolves.toBe(true);
  });

  it('can return no historical range when there are no source metrics', async () => {
    const { knex } = createKnex([{}]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await expect(
      repository.getHistoricalRollupRange([{ service: 'pdf-service', duration: { metric: 'pdf-service:duration' } }])
    ).resolves.toBeNull();
  });

  it('can cap historical range at the last completed day', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));

    const { knex } = createKnex([{ start: '2026-08-20T12:00:00.000Z', end: '2026-08-25T12:00:00.000Z' }]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await expect(
      repository.getHistoricalRollupRange([{ service: 'pdf-service', duration: { metricLike: 'pdf:%' } }])
    ).resolves.toEqual({
      start: new Date('2026-08-20T00:00:00.000Z'),
      end: new Date('2026-08-24T00:00:00.000Z'),
    });
  });

  it('can skip historical range when metrics are only on current day', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));

    const { knex } = createKnex([{ start: '2026-08-25T01:00:00.000Z', end: '2026-08-25T02:00:00.000Z' }]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await expect(
      repository.getHistoricalRollupRange([{ service: 'pdf-service', duration: { metric: 'pdf-service:duration' } }])
    ).resolves.toBeNull();
  });

  it('can read known tenant services without duplicates', async () => {
    const { knex } = createKnex([
      [{ tenant: 'tenant-a' }, { tenant: 'tenant-a' }],
      [{ tenant: 'tenant-a' }, { tenant: 'tenant-b' }],
    ]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await expect(
      repository.getKnownTenantServices([
        { service: 'pdf-service', initiated: { namespace: 'pdf-service', name: 'pdf-generation-queued' } },
        { service: 'form-service', duration: { metricLike: 'form-service:%:duration' } },
      ])
    ).resolves.toEqual([
      { tenant: 'tenant-a', service: 'pdf-service' },
      { tenant: 'tenant-a', service: 'form-service' },
      { tenant: 'tenant-b', service: 'form-service' },
    ]);
  });

  it('can read a rollup from metric, payload, duration, and resource sources', async () => {
    const { knex } = createKnex([
      { sum: '4' },
      { sum: '3' },
      { sum: '2' },
      { sum: '12.5', count: '2', max: '8.5' },
      { count: '2' },
    ]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);
    const mapping: ServiceMetricRollupMapping = {
      service: 'notification-service',
      initiated: {
        namespace: 'notification-service',
        name: 'notifications-generated',
        payloadCountPath: ['payload', 'generatedCount'],
      },
      succeeded: { namespace: 'notification-service', name: 'notification-sent' },
      failure_events: { metric: 'notification-service:notification-send-failed:count' },
      duration: { metricLike: 'notification-service:%:duration' },
      resource: {
        namespace: 'notification-service',
        names: ['notifications-generated'],
        contextKey: 'typeId',
      },
    };

    await expect(repository.readRollup(day, 'tenant-a', mapping)).resolves.toEqual({
      day,
      tenant: 'tenant-a',
      service: 'notification-service',
      initiated: 4,
      succeeded: 3,
      failure_events: 2,
      unreconciled: 1,
      duration_sum: 12.5,
      duration_count: 2,
      duration_max: 8.5,
      distinct_resources: 2,
    });
  });

  it('can read null values for fields that do not apply', async () => {
    const { knex } = createKnex([]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await expect(repository.readRollup(day, 'tenant-a', { service: 'calendar-service' })).resolves.toEqual({
      day,
      tenant: 'tenant-a',
      service: 'calendar-service',
      initiated: null,
      succeeded: null,
      failure_events: null,
      unreconciled: null,
      duration_sum: null,
      duration_count: null,
      duration_max: null,
      distinct_resources: null,
    });
  });

  it('can skip empty upserts', async () => {
    const { knex, mock } = createKnex([]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await repository.upsertRollups([]);

    expect(mock).not.toHaveBeenCalled();
  });

  it('can upsert rollups', async () => {
    const { knex, mock } = createKnex([null]);
    const repository = new TimescaleServiceMetricRollupRepository(knex);

    await repository.upsertRollups([
      {
        day,
        tenant: 'tenant-a',
        service: 'pdf-service',
        initiated: 4,
        succeeded: 3,
        failure_events: 0,
        unreconciled: 1,
        duration_sum: 12,
        duration_count: 2,
        duration_max: 8,
        distinct_resources: 1,
      },
    ]);

    expect(mock).toHaveBeenCalledWith('service_metric_rollups');
  });
});
