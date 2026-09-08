/* eslint-disable @typescript-eslint/no-explicit-any */
import { METRIC_INTERVAL_ROLLUP_LOCK_KEY, TimescaleMetricIntervalRollupRepository } from './metricIntervalRollup';

const createQueryStub = (result: unknown) => {
  const stub: any = {};
  ['min', 'max', 'where'].forEach((method) => {
    stub[method] = jest.fn(() => stub);
  });
  stub.first = jest.fn(() => Promise.resolve(result));
  return stub;
};

const createKnex = (result: unknown = undefined, rowCount = 2, locked = true) => {
  const raws: { sql: string; bindings: unknown[] }[] = [];
  const query = createQueryStub(result);
  const knex: any = jest.fn(() => query);
  knex.raw = jest.fn((sql: string, bindings: unknown[] = []) => {
    raws.push({ sql, bindings });

    return Promise.resolve(sql.includes('pg_try_advisory_xact_lock') ? { rows: [{ locked }] } : { rowCount });
  });
  // The transaction is the lock's scope, so the stub hands the callback the same query surface
  // rather than a separate one; the repository is expected to work through what it is given.
  knex.transaction = jest.fn((work: (trx: unknown) => Promise<unknown>) => work(knex));

  return { knex, query, raws };
};

const window = { start: new Date('2026-03-01T00:30:00Z'), end: new Date('2026-03-01T04:00:00Z') };

describe('TimescaleMetricIntervalRollupRepository', () => {
  describe('getMetricsWindow', () => {
    it('returns the first and last metric timestamps', async () => {
      const { knex } = createKnex({ start: '2026-01-01T00:00:00Z', end: '2026-03-01T00:00:00Z' });

      const result = await new TimescaleMetricIntervalRollupRepository(knex).getMetricsWindow();

      expect(result.start).toEqual(new Date('2026-01-01T00:00:00Z'));
      expect(result.end).toEqual(new Date('2026-03-01T00:00:00Z'));
    });

    it('returns null when no metrics have been written', async () => {
      const { knex } = createKnex({ start: null, end: null });

      expect(await new TimescaleMetricIntervalRollupRepository(knex).getMetricsWindow()).toBeNull();
    });
  });

  describe('getCoverage', () => {
    it('maps the stored span onto the coverage shape', async () => {
      const { knex, query } = createKnex({
        covered_from: '2026-01-01T00:00:00Z',
        covered_to: '2026-03-01T00:00:00Z',
      });

      const coverage = await new TimescaleMetricIntervalRollupRepository(knex).getCoverage('hourly');

      expect(query.where).toHaveBeenCalledWith({ interval: 'hourly' });
      expect(coverage).toEqual({
        interval: 'hourly',
        coveredFrom: new Date('2026-01-01T00:00:00Z'),
        coveredTo: new Date('2026-03-01T00:00:00Z'),
      });
    });

    it('returns null for an interval that has never been rolled up', async () => {
      const { knex } = createKnex(undefined);

      expect(await new TimescaleMetricIntervalRollupRepository(knex).getCoverage('hourly')).toBeNull();
    });
  });

  describe('withRollupLock', () => {
    it('runs the work when the lock is free', async () => {
      const { knex, raws } = createKnex();
      const work = jest.fn().mockResolvedValue(4);

      const result = await new TimescaleMetricIntervalRollupRepository(knex).withRollupLock(work);

      expect(result).toBe(4);
      expect(raws[0].sql).toContain('pg_try_advisory_xact_lock');
      expect(raws[0].bindings).toEqual([METRIC_INTERVAL_ROLLUP_LOCK_KEY]);
    });

    // A replica that loses the race has to leave the run to the winner rather than repeating it.
    it('skips the work and resolves null when another instance holds the lock', async () => {
      const { knex } = createKnex(undefined, 2, false);
      const work = jest.fn();

      expect(await new TimescaleMetricIntervalRollupRepository(knex).withRollupLock(work)).toBeNull();
      expect(work).not.toHaveBeenCalled();
    });

    // The work has to run on the connection holding the lock, so the callback gets a repository
    // bound to the transaction rather than the one withRollupLock was called on.
    it('hands the work a repository bound to the locked transaction', async () => {
      const { knex } = createKnex();
      let handed: unknown;

      await new TimescaleMetricIntervalRollupRepository(knex).withRollupLock(async (repository) => {
        handed = repository;
        return 0;
      });

      expect(handed).toBeInstanceOf(TimescaleMetricIntervalRollupRepository);
      expect(knex.transaction).toHaveBeenCalled();
    });

    // SET takes no bind parameter, so the value is interpolated; it is truncated rather than
    // passed through, and SET LOCAL keeps it off the connection once it goes back to the pool.
    it('applies a statement timeout to the locked connection only', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleMetricIntervalRollupRepository(knex, 90000.7).withRollupLock(async () => 0);

      expect(raws[1].sql).toBe('SET LOCAL statement_timeout = 90000');
    });

    it('leaves the timeout at the server default when none is configured', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleMetricIntervalRollupRepository(knex).withRollupLock(async () => 0);

      expect(raws.some(({ sql }) => sql.includes('statement_timeout'))).toBe(false);
    });
  });

  describe('refresh', () => {
    it('returns the number of rows the upsert touched', async () => {
      const { knex } = createKnex(undefined, 7);

      const refreshed = await new TimescaleMetricIntervalRollupRepository(knex).refresh('hourly', '1 hour', window);

      expect(refreshed).toBe(7);
    });

    // tenant is nullable and a null cannot take part in a unique index, so the conflict target has
    // to coalesce it. Without this every null-tenant bucket inserts a duplicate on each refresh.
    it('upserts on the coalesced tenant key', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleMetricIntervalRollupRepository(knex).refresh('hourly', '1 hour', window);

      expect(raws[0].sql).toContain(
        `ON CONFLICT ("interval", namespace, name, metric, bucket, (COALESCE(tenant, '')))`,
      );
      expect(raws[0].sql).toContain('DO UPDATE SET');
    });

    // Repeating the time_bucket expression in the GROUP BY binds a second placeholder, which
    // Postgres cannot match against the one in the select list.
    it('groups by select-list ordinals rather than repeating time_bucket', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleMetricIntervalRollupRepository(knex).refresh('hourly', '1 hour', window);

      expect(raws[0].sql).toContain('GROUP BY 2, 3, 4, 5, 6');
      expect(raws[0].sql.match(/time_bucket/g)).toHaveLength(2);
    });

    it('snaps the window start down to a bucket boundary', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleMetricIntervalRollupRepository(knex).refresh('hourly', '1 hour', window);

      expect(raws[0].sql).toContain('WHERE timestamp >= time_bucket(?::interval, ?::timestamptz) AND timestamp < ?');
      expect(raws[0].bindings).toEqual(['hourly', '1 hour', '1 hour', window.start, window.end]);
    });

    it('merges coverage outwards so neither edge is lost', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleMetricIntervalRollupRepository(knex).refresh('hourly', '1 hour', window);

      expect(raws).toHaveLength(2);
      expect(raws[1].sql).toContain('LEAST(metric_interval_rollup_coverage.covered_from, EXCLUDED.covered_from)');
      expect(raws[1].sql).toContain('GREATEST(metric_interval_rollup_coverage.covered_to, EXCLUDED.covered_to)');
      expect(raws[1].bindings).toEqual(['hourly', '1 hour', window.start, window.end]);
    });
  });
});
