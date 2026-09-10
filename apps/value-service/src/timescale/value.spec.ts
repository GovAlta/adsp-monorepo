/* eslint-disable @typescript-eslint/no-explicit-any */
import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { TimescaleValuesRepository } from './value';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/aaa`;

interface KnexStubOptions {
  coverage?: unknown;
  rows?: unknown[];
  tableRows?: Record<string, unknown[]>;
  countRows?: unknown[];
}

const createKnex = ({ coverage = undefined, rows = [], tableRows = {}, countRows }: KnexStubOptions = {}) => {
  const tables: string[] = [];
  const wheres: unknown[][] = [];
  const whereRaws: unknown[][] = [];
  const selects: unknown[][] = [];
  const inserted: Record<string, unknown> = {};

  const coverageQuery: any = {};
  coverageQuery.where = jest.fn(() => coverageQuery);
  coverageQuery.first = jest.fn(() => Promise.resolve(coverage));

  const builders: Record<string, any> = {};
  const builderFor = (table: string) => {
    if (!builders[table]) {
      const resolved = tableRows[table] ?? rows;
      const builder: any = {};
      ['offset', 'limit'].forEach((method) => {
        builder[method] = jest.fn(() => builder);
      });
      builder.select = jest.fn((...args: unknown[]) => {
        selects.push(args);
        return builder;
      });
      builder.where = jest.fn((...args: unknown[]) => {
        wheres.push(args);
        return builder;
      });
      builder.whereRaw = jest.fn((...args: unknown[]) => {
        whereRaws.push(args);
        return builder;
      });
      builder.insert = jest.fn((values: unknown) => {
        inserted[table] = values;
        return builder;
      });
      builder.returning = jest.fn(() => Promise.resolve(resolved));
      builder.count = jest.fn(() => Promise.resolve(countRows ?? [{ count: '0' }]));
      builder.orderBy = jest.fn(() => Promise.resolve(resolved));
      builders[table] = builder;
    }
    return builders[table];
  };

  const knex: any = jest.fn((table: string) => {
    tables.push(table);
    return table === 'metric_interval_rollup_coverage' ? coverageQuery : builderFor(table);
  });
  knex.raw = jest.fn((sql: string) => ({ raw: sql }));
  knex.transaction = jest.fn((work: (ts: unknown) => unknown) => Promise.resolve(work(knex)));

  return { knex, tables, wheres, whereRaws, selects, inserted, builderFor };
};

const criteria = {
  interval: 'hourly' as const,
  intervalMin: new Date('2026-03-01T00:00:00Z'),
  intervalMax: new Date('2026-03-02T00:00:00Z'),
};

const spanning = {
  covered_from: '2026-02-01T00:00:00Z',
  covered_to: '2026-04-01T00:00:00Z',
};

describe('TimescaleValuesRepository metric source routing', () => {
  describe('readMetrics', () => {
    it('falls back to the interval view when the interval has never been rolled up', async () => {
      const { knex, tables, selects } = createKnex();

      await new TimescaleValuesRepository(knex).readMetrics(tenantId, 'test', 'metrics', 100, undefined, {
        ...criteria,
      });

      expect(tables).toContain('metrics_hourly');
      expect(tables).not.toContain('metric_interval_rollups');
      // The view carries its own avg column.
      expect(selects[0]).toContain('avg');
    });

    it('reads the rollups when coverage spans the requested window', async () => {
      const { knex, tables, wheres } = createKnex({ coverage: spanning });

      await new TimescaleValuesRepository(knex).readMetrics(tenantId, 'test', 'metrics', 100, undefined, {
        ...criteria,
      });

      expect(tables).toContain('metric_interval_rollups');
      expect(tables).not.toContain('metrics_hourly');
      // Rollups hold every interval, so the interval itself has to be part of the filter.
      expect(wheres).toContainEqual([{ interval: 'hourly' }]);
    });

    it('divides sum by count for the average the rollups do not store', async () => {
      const { knex, selects } = createKnex({ coverage: spanning });

      await new TimescaleValuesRepository(knex).readMetrics(tenantId, 'test', 'metrics', 100, undefined, {
        ...criteria,
      });

      expect(selects[0]).toContainEqual({ raw: 'CASE WHEN count > 0 THEN sum / count ELSE NULL END as avg' });
    });

    it('falls back to the view when the window starts before coverage', async () => {
      const { knex, tables } = createKnex({
        coverage: { covered_from: '2026-03-01T12:00:00Z', covered_to: '2026-04-01T00:00:00Z' },
      });

      await new TimescaleValuesRepository(knex).readMetrics(tenantId, 'test', 'metrics', 100, undefined, {
        ...criteria,
      });

      expect(tables).toContain('metrics_hourly');
    });

    it('falls back to the view when the window ends after coverage', async () => {
      const { knex, tables } = createKnex({
        coverage: { covered_from: '2026-02-01T00:00:00Z', covered_to: '2026-03-01T12:00:00Z' },
      });

      await new TimescaleValuesRepository(knex).readMetrics(tenantId, 'test', 'metrics', 100, undefined, {
        ...criteria,
      });

      expect(tables).toContain('metrics_hourly');
    });

    it('uses the rollups when the window exactly matches coverage', async () => {
      const { knex, tables } = createKnex({
        coverage: { covered_from: criteria.intervalMin, covered_to: criteria.intervalMax },
      });

      await new TimescaleValuesRepository(knex).readMetrics(tenantId, 'test', 'metrics', 100, undefined, {
        ...criteria,
      });

      expect(tables).toContain('metric_interval_rollups');
    });

    it('rejects an unrecognized interval before touching the database', async () => {
      const { knex, tables } = createKnex();

      await expect(
        new TimescaleValuesRepository(knex).readMetrics(tenantId, 'test', 'metrics', 100, undefined, {
          ...criteria,
          interval: 'yearly' as never,
        }),
      ).rejects.toThrow(InvalidOperationError);
      expect(tables).toHaveLength(0);
    });
  });

  describe('readMetric', () => {
    it('routes a single metric to the rollups on the same coverage rule', async () => {
      const { knex, tables, wheres } = createKnex({ coverage: spanning });

      await new TimescaleValuesRepository(knex).readMetric(tenantId, 'test', 'metrics', 'requests', 100, undefined, {
        ...criteria,
      });

      expect(tables).toContain('metric_interval_rollups');
      expect(wheres).toContainEqual([{ interval: 'hourly' }]);
    });

    it('falls back to the view for a single metric with no coverage', async () => {
      const { knex, tables } = createKnex();

      await new TimescaleValuesRepository(knex).readMetric(tenantId, 'test', 'metrics', 'requests', 100, undefined, {
        ...criteria,
      });

      expect(tables).toContain('metrics_hourly');
    });

    it('still rejects the sub-hourly intervals it never supported', async () => {
      const { knex } = createKnex({ coverage: spanning });

      await expect(
        new TimescaleValuesRepository(knex).readMetric(tenantId, 'test', 'metrics', 'requests', 100, undefined, {
          ...criteria,
          interval: 'one_minute',
        }),
      ).rejects.toThrow(InvalidOperationError);
    });
  });
});

const tenantUrn = 'urn:ads:platform:tenant-service:v2:/tenants/aaa';

describe('TimescaleValuesRepository readPlatformMetrics', () => {
  it('reads directly from the rollups without checking coverage', async () => {
    const { knex, tables, wheres } = createKnex({
      tableRows: {
        metric_interval_rollups: [
          { metric: 'count', bucket: '2026-03-01T00:00:00Z', sum: 10, min: 1, max: 5, count: 2, tenant: 'tenant-a' },
          { metric: 'count', bucket: '2026-03-01T00:00:00Z', sum: 20, min: 2, max: 8, count: 4, tenant: 'tenant-b' },
        ],
      },
    });

    const result = await new TimescaleValuesRepository(knex).readPlatformMetrics('test', 'metrics', { ...criteria });

    expect(tables).toContain('metric_interval_rollups');
    expect(tables).not.toContain('metric_interval_rollup_coverage');
    expect(wheres).toContainEqual([{ namespace: 'test', name: 'metrics', interval: 'hourly' }]);
    expect(result.count.values).toHaveLength(2);
    expect(result.count.values).toContainEqual(
      expect.objectContaining({ tenantId: 'tenant-a', sum: 10, min: 1, max: 5, count: 2 }),
    );
    expect(result.count.values).toContainEqual(
      expect.objectContaining({ tenantId: 'tenant-b', sum: 20, min: 2, max: 8, count: 4 }),
    );
  });

  it('filters by metricLike', async () => {
    const { knex, wheres } = createKnex({ tableRows: { metric_interval_rollups: [] } });
    const repository = new TimescaleValuesRepository(knex);

    const result = await repository.readPlatformMetrics('test', 'metrics', { ...criteria, metricLike: 'count' });

    expect(wheres).toContainEqual(['metric', 'like', '%count%']);
    expect(result).toEqual({});
  });

  it('rejects an unrecognized interval before touching the database', async () => {
    const { knex, tables } = createKnex();

    await expect(
      new TimescaleValuesRepository(knex).readPlatformMetrics('test', 'metrics', {
        ...criteria,
        interval: 'yearly' as never,
      }),
    ).rejects.toThrow(InvalidOperationError);
    expect(tables).toHaveLength(0);
  });
});

describe('TimescaleValuesRepository writeValues', () => {
  const written = [
    {
      timestamp: new Date('2026-03-01T00:00:00Z'),
      correlationId: 'abc',
      tenant: tenantUrn,
      context: { a: 1 },
      value: { b: 2 },
    },
  ];

  it('inserts a row per value and maps the tenant back to an AdspId', async () => {
    const { knex, inserted } = createKnex({ tableRows: { values: written } });

    const results = await new TimescaleValuesRepository(knex).writeValues('test', 'metrics', tenantId, [
      { timestamp: written[0].timestamp, correlationId: 'abc', context: { a: 1 }, value: { b: 2 } } as any,
    ]);

    expect(inserted['values']).toEqual([
      {
        namespace: 'test',
        name: 'metrics',
        timestamp: written[0].timestamp,
        tenant: tenantUrn,
        correlationId: 'abc',
        context: { a: 1 },
        value: { b: 2 },
      },
    ]);
    expect(results[0].tenantId.toString()).toBe(tenantUrn);
  });

  it('defaults a missing context to an empty object', async () => {
    const { knex, inserted } = createKnex({ tableRows: { values: written } });

    await new TimescaleValuesRepository(knex).writeValues('test', 'metrics', tenantId, [
      { timestamp: written[0].timestamp, value: { b: 2 } } as any,
    ]);

    expect(inserted['values'][0].context).toEqual({});
  });

  it('returns a null tenantId when the row carries no tenant', async () => {
    const { knex } = createKnex({ tableRows: { values: [{ ...written[0], tenant: null }] } });

    const results = await new TimescaleValuesRepository(knex).writeValues('test', 'metrics', null, [
      { timestamp: written[0].timestamp, value: {} } as any,
    ]);

    expect(results[0].tenantId).toBeNull();
  });

  it('writes a metric row for each numeric metric and ignores the rest', async () => {
    const { knex, inserted } = createKnex({
      tableRows: { values: written, metrics: [{ namespace: 'test', name: 'metrics', metric: 'count', value: 1 }] },
    });

    await new TimescaleValuesRepository(knex).writeValues('test', 'metrics', tenantId, [
      {
        timestamp: written[0].timestamp,
        value: {},
        metrics: { count: 1, ignored: 'not a number' },
      } as any,
    ]);

    expect(inserted['metrics']).toHaveLength(1);
    expect(inserted['metrics'][0]).toMatchObject({ metric: 'count', value: 1, tenant: tenantUrn });
  });

  it('does not touch the metrics table when no metrics are supplied', async () => {
    const { knex, tables } = createKnex({ tableRows: { values: written } });

    await new TimescaleValuesRepository(knex).writeValues('test', 'metrics', tenantId, [
      { timestamp: written[0].timestamp, value: {} } as any,
    ]);

    expect(tables).not.toContain('metrics');
  });

  it('warns when a null character had to be stripped before the write', async () => {
    const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() } as any;
    const { knex } = createKnex({ tableRows: { values: written } });

    await new TimescaleValuesRepository(knex, logger).writeValues('test', 'metrics', tenantId, [
      { timestamp: written[0].timestamp, value: { b: 'bad\u0000value' } } as any,
    ]);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Removed null characters'),
      expect.objectContaining({ context: 'TimescaleValuesRepository' }),
    );
  });
});

describe('TimescaleValuesRepository readValues', () => {
  const row = {
    timestamp: new Date('2026-03-01T00:00:00Z'),
    correlationId: 'abc',
    tenant: tenantUrn,
    context: {},
    value: {},
  };

  it('reads without criteria', async () => {
    const { knex, wheres, whereRaws } = createKnex({ tableRows: { values: [row] } });

    const results = await new TimescaleValuesRepository(knex).readValues(10);

    expect(wheres).toHaveLength(0);
    expect(whereRaws).toHaveLength(0);
    expect(results.results).toHaveLength(1);
    expect(results.results[0].tenantId.toString()).toBe(tenantUrn);
  });

  it('collects the equality criteria into a single where', async () => {
    const { knex, wheres } = createKnex({ tableRows: { values: [row] } });

    await new TimescaleValuesRepository(knex).readValues(10, undefined, {
      tenantId,
      namespace: 'test',
      name: 'metrics',
      correlationId: 'abc',
    } as any);

    expect(wheres[0]).toEqual([{ tenant: tenantUrn, namespace: 'test', name: 'metrics', correlationId: 'abc' }]);
  });

  it('applies the timestamp bounds as separate comparisons', async () => {
    const { knex, wheres } = createKnex({ tableRows: { values: [row] } });
    const timestampMin = new Date('2026-01-01T00:00:00Z');
    const timestampMax = new Date('2026-02-01T00:00:00Z');

    await new TimescaleValuesRepository(knex).readValues(10, undefined, { timestampMin, timestampMax } as any);

    expect(wheres).toContainEqual(['timestamp', '<=', timestampMax]);
    expect(wheres).toContainEqual(['timestamp', '>=', timestampMin]);
  });

  it('matches context, value and url through jsonb containment', async () => {
    const { knex, whereRaws } = createKnex({ tableRows: { values: [row] } });

    await new TimescaleValuesRepository(knex).readValues(10, undefined, {
      context: { namespace: 'x' },
      value: 'target-1',
      url: 'https://example.test',
    } as any);

    expect(whereRaws[0]).toEqual(['context @> ?::jsonb', [JSON.stringify({ namespace: 'x' })]]);
    expect(whereRaws[1]).toEqual(['value @> ?::jsonb', ['{"payload": {"targetId": "target-1"}}']]);
    expect(whereRaws[2]).toEqual(['value @> ?::jsonb', ['{"payload": {"URL": "https://example.test"}}']]);
  });

  it('reports the page size and a null tenant', async () => {
    const { knex } = createKnex({ tableRows: { values: [{ ...row, tenant: null }] } });

    const results = await new TimescaleValuesRepository(knex).readValues(1);

    expect(results.page.size).toBe(1);
    expect(results.results[0].tenantId).toBeNull();
  });
});

describe('TimescaleValuesRepository countValues', () => {
  it('parses a string count', async () => {
    const { knex } = createKnex({ tableRows: { values: [] }, countRows: [{ count: '42' }] });

    expect(await new TimescaleValuesRepository(knex).countValues(undefined)).toBe(42);
  });

  it('passes a numeric count straight through', async () => {
    const { knex } = createKnex({ tableRows: { values: [] }, countRows: [{ count: 7 }] });

    expect(await new TimescaleValuesRepository(knex).countValues(undefined)).toBe(7);
  });

  it('applies the same equality, timestamp and context criteria as a read', async () => {
    const { knex, wheres, whereRaws } = createKnex({ tableRows: { values: [] }, countRows: [{ count: '1' }] });
    const timestampMin = new Date('2026-01-01T00:00:00Z');
    const timestampMax = new Date('2026-02-01T00:00:00Z');

    await new TimescaleValuesRepository(knex).countValues({
      tenantId,
      namespace: 'test',
      name: 'metrics',
      correlationId: 'abc',
      timestampMin,
      timestampMax,
      context: { namespace: 'x' },
    } as any);

    expect(wheres[0]).toEqual([{ tenant: tenantUrn, namespace: 'test', name: 'metrics', correlationId: 'abc' }]);
    expect(wheres).toContainEqual(['timestamp', '<=', timestampMax]);
    expect(wheres).toContainEqual(['timestamp', '>=', timestampMin]);
    expect(whereRaws[0]).toEqual(['context @> ?::jsonb', [JSON.stringify({ namespace: 'x' })]]);
  });
});

describe('TimescaleValuesRepository writeMetric', () => {
  it('inserts the metric inside a transaction and returns the stored record', async () => {
    const stored = {
      namespace: 'test',
      name: 'metrics',
      metric: 'requests',
      timestamp: new Date('2026-03-01T00:00:00Z'),
      value: 5,
    };
    const { knex, inserted } = createKnex({ tableRows: { metrics: [stored] } });

    const result = await new TimescaleValuesRepository(knex).writeMetric(
      tenantId,
      'test',
      'metrics',
      'requests',
      stored.timestamp,
      5,
    );

    expect(knex.transaction).toHaveBeenCalled();
    expect(inserted['metrics']).toEqual([
      {
        namespace: 'test',
        name: 'metrics',
        tenant: tenantUrn,
        metric: 'requests',
        timestamp: stored.timestamp,
        value: 5,
      },
    ]);
    expect(result).toEqual(stored);
  });
});
