/* eslint-disable @typescript-eslint/no-explicit-any */
const migration = require('../../migrations/20260908000000_create_metric_interval_rollups');
const supersededMigration = require('../../migrations/20260827120000_create_metric_continuous_aggregates');

const aggregateNames = [
  'metrics_one_minute_continuous',
  'metrics_five_minutes_continuous',
  'metrics_hourly_continuous',
  'metrics_daily_continuous',
  'metrics_weekly_continuous',
  'metrics_monthly_continuous',
];

const createTableBuilder = (columns: string[]) => {
  const chain: any = new Proxy(
    {},
    {
      get:
        (_target, property) =>
        (...args: unknown[]) => {
          if (['string', 'timestamp', 'decimal', 'integer'].includes(String(property))) {
            columns.push(String(args[0]));
          }
          return chain;
        },
    },
  );
  return chain;
};

const createKnex = () => {
  const statements: string[] = [];
  const created: Record<string, string[]> = {};
  const operations: string[] = [];

  const knex = {
    fn: { now: () => 'now()' },
    schema: {
      raw: jest.fn((statement: string) => {
        statements.push(statement);
        operations.push(`raw:${statement.slice(0, 40)}`);
        return Promise.resolve();
      }),
      createTable: jest.fn((name: string, build: (table: unknown) => void) => {
        const columns: string[] = [];
        build(createTableBuilder(columns));
        created[name] = columns;
        operations.push(`createTable:${name}`);
        return Promise.resolve();
      }),
      dropTableIfExists: jest.fn((name: string) => {
        operations.push(`dropTableIfExists:${name}`);
        return Promise.resolve();
      }),
    },
  };

  return { knex, statements, created, operations };
};

describe('metric interval rollup migration', () => {
  it('drops the continuous aggregates the superseded migration may have left behind', async () => {
    const { knex, statements } = createKnex();

    await migration.up(knex);

    const sql = statements.join('\n');
    aggregateNames.forEach((name) => {
      expect(sql).toContain(`DROP MATERIALIZED VIEW IF EXISTS ${name} CASCADE;`);
    });
    expect(sql).toContain('DROP PROCEDURE IF EXISTS backfill_metric_continuous_aggregate');
    expect(sql).toContain('DROP TABLE IF EXISTS metric_continuous_aggregate_backfills;');
  });

  it('creates the rollup and coverage tables', async () => {
    const { knex, created } = createKnex();

    await migration.up(knex);

    expect(Object.keys(created)).toEqual(['metric_interval_rollups', 'metric_interval_rollup_coverage']);
    expect(created['metric_interval_rollups']).toEqual([
      'interval',
      'namespace',
      'name',
      'tenant',
      'metric',
      'bucket',
      'sum',
      'count',
      'min',
      'max',
      'updated_at',
    ]);
    expect(created['metric_interval_rollup_coverage']).toEqual([
      'interval',
      'covered_from',
      'covered_to',
      'updated_at',
    ]);
  });

  // tenant is nullable, and a null cannot take part in a unique constraint, so the upsert target
  // has to coalesce it or every null-tenant bucket would insert a duplicate on each refresh.
  it('keys the rollups on a coalesced tenant so null tenants still upsert', async () => {
    const { knex, statements } = createKnex();

    await migration.up(knex);

    const index = statements.find((statement) => statement.includes('idx_metric_interval_rollups_key'));
    expect(index).toContain('CREATE UNIQUE INDEX');
    expect(index).toContain("(COALESCE(tenant, ''))");
  });

  it('drops both tables on the way down', async () => {
    const { knex, operations } = createKnex();

    await migration.down(knex);

    expect(operations).toEqual([
      'dropTableIfExists:metric_interval_rollup_coverage',
      'dropTableIfExists:metric_interval_rollups',
    ]);
  });
});

describe('superseded continuous aggregate migration', () => {
  // Kept as a no-op rather than deleted: knex refuses to run when a migration recorded in
  // value_service_migrations is missing from the directory.
  it('does nothing in either direction', async () => {
    const { knex, operations } = createKnex();

    await supersededMigration.up(knex);
    await supersededMigration.down(knex);

    expect(operations).toEqual([]);
  });
});
