/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_RESOURCE_ROLLUP_LOCK_KEY, TimescaleEventResourceRollupRepository } from './eventResourceRollup';

const createQueryStub = (result: unknown) => {
  const stub: any = {};
  ['max', 'where'].forEach((method) => {
    stub[method] = jest.fn(() => stub);
  });
  stub.first = jest.fn(() => Promise.resolve(result));
  return stub;
};

const createKnex = ({ first = undefined as unknown, rowCount = 2, locked = true, count = 0 } = {}) => {
  const raws: { sql: string; bindings: unknown[] }[] = [];
  const query = createQueryStub(first);
  const knex: any = jest.fn(() => query);
  knex.raw = jest.fn((sql: string, bindings: unknown[] = []) => {
    raws.push({ sql, bindings });

    if (sql.includes('pg_try_advisory_xact_lock')) {
      return Promise.resolve({ rows: [{ locked }] });
    }
    if (sql.includes('COUNT(DISTINCT resource)')) {
      return Promise.resolve({ rows: [{ count }] });
    }
    return Promise.resolve({ rowCount });
  });
  knex.transaction = jest.fn((work: (trx: unknown) => Promise<unknown>) => work(knex));

  return { knex, query, raws };
};

const source = {
  namespace: 'pdf-service',
  names: ['pdf-generated', 'pdf-generation-failed'],
  contextKey: 'templateId',
};

const criteria = {
  ...source,
  tenant: 'urn:ads:platform:tenant-service:v2:/tenants/test',
  from: new Date('2026-10-01T00:00:00Z'),
  to: new Date('2026-11-10T00:00:00Z'),
};

const coverage = { covered_from: '2026-09-01T00:00:00Z', covered_to: '2026-11-09T00:00:00Z' };

describe('TimescaleEventResourceRollupRepository', () => {
  describe('withRollupLock', () => {
    it('takes its own lock key, so it does not wait on the interval rollups', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleEventResourceRollupRepository(knex).withRollupLock(async () => 0);

      expect(raws[0].sql).toContain('pg_try_advisory_xact_lock');
      expect(raws[0].bindings).toEqual([EVENT_RESOURCE_ROLLUP_LOCK_KEY]);
    });

    it('skips the work and resolves null when another instance holds the lock', async () => {
      const { knex } = createKnex({ locked: false });
      const work = jest.fn();

      expect(await new TimescaleEventResourceRollupRepository(knex).withRollupLock(work)).toBeNull();
      expect(work).not.toHaveBeenCalled();
    });

    it('bounds the locked transaction by the statement timeout', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleEventResourceRollupRepository(knex, 180000).withRollupLock(async () => 0);

      expect(raws[1].sql).toBe('SET LOCAL statement_timeout = 180000');
    });

    it('hands the work a repository bound to the locked transaction', async () => {
      const { knex } = createKnex();
      let handed: unknown;

      await new TimescaleEventResourceRollupRepository(knex).withRollupLock(async (repository) => {
        handed = repository;
        return 0;
      });

      expect(handed).toBeInstanceOf(TimescaleEventResourceRollupRepository);
    });
  });

  describe('getCoverage', () => {
    it('reads coverage per namespace and context key', async () => {
      const { knex, query } = createKnex({ first: coverage });

      const result = await new TimescaleEventResourceRollupRepository(knex).getCoverage(source);

      expect(knex).toHaveBeenCalledWith('event_resource_rollup_coverage');
      expect(query.where).toHaveBeenCalledWith({ namespace: 'pdf-service', context_key: 'templateId' });
      expect(result).toEqual({
        namespace: 'pdf-service',
        contextKey: 'templateId',
        coveredFrom: new Date('2026-09-01T00:00:00Z'),
        coveredTo: new Date('2026-11-09T00:00:00Z'),
      });
    });

    it('returns null for a source that has never been rolled up', async () => {
      const { knex } = createKnex();

      expect(await new TimescaleEventResourceRollupRepository(knex).getCoverage(source)).toBeNull();
    });
  });

  describe('getEventLogEndBefore', () => {
    // A max over the hypertable would lock every chunk; the catalog has each chunk's range.
    it('reads the newest chunk below the given time from chunk metadata', async () => {
      const { knex, query } = createKnex({ first: { end: '2012-04-26T00:00:00Z' } });
      const before = new Date('2022-01-06T00:00:00Z');

      const result = await new TimescaleEventResourceRollupRepository(knex).getEventLogEndBefore(before);

      expect(knex).toHaveBeenCalledWith('timescaledb_information.chunks');
      expect(query.where).toHaveBeenCalledWith({ hypertable_name: 'values' });
      expect(query.where).toHaveBeenCalledWith('range_start', '<', before);
      expect(result).toEqual(new Date('2012-04-26T00:00:00Z'));
    });

    it('returns null when nothing is stored before the given time', async () => {
      const { knex } = createKnex({ first: { end: null } });

      expect(await new TimescaleEventResourceRollupRepository(knex).getEventLogEndBefore(new Date())).toBeNull();
    });
  });

  describe('refresh', () => {
    it('rolls up whole days, cut in the application so the planner sees plain timestamps', async () => {
      const { knex, raws } = createKnex({ rowCount: 7 });

      const rows = await new TimescaleEventResourceRollupRepository(knex).refresh(source, {
        start: new Date('2026-11-01T05:00:00Z'),
        end: new Date('2026-11-03T23:00:00Z'),
      });

      expect(rows).toBe(7);
      const [insert, extend] = raws;
      expect(insert.sql).toContain('INSERT INTO event_resource_rollups');
      expect(insert.sql).not.toMatch(/WHERE[\s\S]*time_bucket/);
      expect(insert.bindings).toEqual([
        'pdf-service',
        'templateId',
        'templateId',
        'event-service',
        'event',
        new Date('2026-11-01T00:00:00Z'),
        new Date('2026-11-03T00:00:00Z'),
        JSON.stringify({ namespace: 'pdf-service' }),
        'pdf-generated',
        'pdf-generation-failed',
        'templateId',
      ]);
      expect(extend.sql).toContain('INSERT INTO event_resource_rollup_coverage');
      expect(extend.bindings).toEqual([
        'pdf-service',
        'templateId',
        new Date('2026-11-01T00:00:00Z'),
        new Date('2026-11-03T00:00:00Z'),
      ]);
    });

    it('binds one placeholder per event name', async () => {
      const { knex, raws } = createKnex();

      await new TimescaleEventResourceRollupRepository(knex).refresh(source, {
        start: new Date('2026-11-01T00:00:00Z'),
        end: new Date('2026-11-02T00:00:00Z'),
      });

      expect(raws[0].sql).toContain("context->>'name' IN (?, ?)");
      expect(raws[0].sql.split('?').length - 1).toBe(raws[0].bindings.length);
    });

    // Extending over a partial day would advertise it as rolled up.
    it('writes nothing and leaves coverage alone for a window inside one day', async () => {
      const { knex, raws } = createKnex();

      const rows = await new TimescaleEventResourceRollupRepository(knex).refresh(source, {
        start: new Date('2026-11-01T01:00:00Z'),
        end: new Date('2026-11-01T23:00:00Z'),
      });

      expect(rows).toBe(0);
      expect(raws).toEqual([]);
    });
  });

  describe('countDistinct', () => {
    it('reads covered days from the rollup and only the uncovered tail from the event log', async () => {
      const { knex, raws } = createKnex({ first: coverage, count: 9 });

      const count = await new TimescaleEventResourceRollupRepository(knex).countDistinct(criteria);

      expect(count).toBe(9);
      const [{ sql, bindings }] = raws;
      expect(sql).toContain('COUNT(DISTINCT resource)');
      expect(sql.match(/FROM event_resource_rollups/g)).toHaveLength(1);
      expect(sql.match(/FROM "values"/g)).toHaveLength(1);
      expect(bindings).toEqual(
        expect.arrayContaining([
          new Date('2026-10-01T00:00:00Z'),
          new Date('2026-11-09T00:00:00Z'),
          new Date('2026-11-10T00:00:00Z'),
        ]),
      );
      expect(sql.split('?').length - 1).toBe(bindings.length);
    });

    it('reads uncovered history before coverage from the event log too', async () => {
      const { knex, raws } = createKnex({
        first: { covered_from: '2026-10-15T00:00:00Z', covered_to: '2026-11-09T00:00:00Z' },
      });

      await new TimescaleEventResourceRollupRepository(knex).countDistinct(criteria);

      expect(raws[0].sql.match(/FROM "values"/g)).toHaveLength(2);
      expect(raws[0].sql.match(/FROM event_resource_rollups/g)).toHaveLength(1);
    });

    it('needs no event log read for a period coverage holds whole', async () => {
      const { knex, raws } = createKnex({ first: coverage });

      await new TimescaleEventResourceRollupRepository(knex).countDistinct({
        ...criteria,
        to: new Date('2026-11-01T00:00:00Z'),
      });

      expect(raws[0].sql).not.toContain('FROM "values"');
    });

    it('reads the whole period from the event log before the source has been rolled up', async () => {
      const { knex, raws } = createKnex({ count: 4 });

      const count = await new TimescaleEventResourceRollupRepository(knex).countDistinct(criteria);

      expect(count).toBe(4);
      expect(raws[0].sql).not.toContain('event_resource_rollups');
      expect(raws[0].bindings).toEqual(expect.arrayContaining([criteria.from, criteria.to]));
    });

    it('scopes both parts to the tenant', async () => {
      const { knex, raws } = createKnex({ first: coverage });

      await new TimescaleEventResourceRollupRepository(knex).countDistinct(criteria);

      expect(raws[0].bindings.filter((binding) => binding === criteria.tenant)).toHaveLength(2);
    });
  });
});
