// eslint-disable-next-line @typescript-eslint/no-var-requires
const migration = require('../../migrations/20260827120000_create_metric_continuous_aggregates');

const aggregateNames = [
  'metrics_one_minute_continuous',
  'metrics_five_minutes_continuous',
  'metrics_hourly_continuous',
  'metrics_daily_continuous',
  'metrics_weekly_continuous',
  'metrics_monthly_continuous',
];

const createKnex = () => {
  const statements: string[] = [];
  return {
    knex: {
      schema: {
        raw: jest.fn((statement: string) => {
          statements.push(statement);
          return Promise.resolve();
        }),
      },
    },
    statements,
  };
};

describe('metric continuous aggregate migration', () => {
  it('creates non-populated aggregates, refresh policies, and bounded backfill support', async () => {
    const { knex, statements } = createKnex();

    await migration.up(knex);

    const sql = statements.join('\n');
    aggregateNames.forEach((name) => {
      expect(sql).toContain(`CREATE MATERIALIZED VIEW IF NOT EXISTS ${name}`);
      expect(sql).toContain(`add_continuous_aggregate_policy('${name}'`);
    });
    expect(sql).toContain('WITH (timescaledb.continuous) AS');
    expect(sql.match(/WITH NO DATA/g)).toHaveLength(aggregateNames.length);
    expect(sql).toContain('SUM(value) AS sum');
    expect(sql).toContain('COUNT(value) AS count');
    expect(sql).not.toContain('AVG(value)');
    expect(sql).toContain("time_bucket(INTERVAL '1 month', timestamp)");
    expect(sql).toContain('CREATE OR REPLACE PROCEDURE backfill_metric_continuous_aggregate');
    expect(sql).toContain("p_window_end - p_window_start > INTERVAL '31 days'");
    expect(sql).toContain('FROM metric_continuous_aggregate_backfills backfill');
    expect(sql).toContain('CALL refresh_continuous_aggregate(p_aggregate, p_window_start, p_window_end)');
  });

  // The migration runs unwrapped, so a failure part way through leaves earlier statements applied and
  // knex replays the whole thing on the next boot. Every statement has to tolerate that replay.
  it('only issues statements that are safe to re-run', async () => {
    const { knex, statements } = createKnex();

    await migration.up(knex);

    statements.forEach((statement) => {
      expect(statement).not.toMatch(/CREATE MATERIALIZED VIEW(?! IF NOT EXISTS)/);
      expect(statement).not.toMatch(/CREATE TABLE(?! IF NOT EXISTS)/);
      expect(statement).not.toMatch(/CREATE PROCEDURE/);
    });

    const sql = statements.join('\n');
    expect(sql.match(/if_not_exists => TRUE/g)).toHaveLength(aggregateNames.length);
  });

  // A month is a variable-width bucket, so Timescale rejects the exactly-two-bucket window the
  // fixed-width aggregates use: 3 months - 1 month fails with 'policy refresh window too small'.
  it('gives the monthly aggregate a refresh window wider than two buckets', async () => {
    const { knex, statements } = createKnex();

    await migration.up(knex);

    const monthly = statements.find((statement) =>
      statement.includes("add_continuous_aggregate_policy('metrics_monthly_continuous'"),
    );
    expect(monthly).toContain("start_offset => INTERVAL '4 months'");
    expect(monthly).toContain("end_offset => INTERVAL '1 month'");
  });

  it('sets aggregate options explicitly so a pre-existing view converges', async () => {
    const { knex, statements } = createKnex();

    await migration.up(knex);

    const sql = statements.join('\n');
    aggregateNames.forEach((name) => {
      expect(sql).toContain(`ALTER MATERIALIZED VIEW ${name} SET (timescaledb.materialized_only = false);`);
    });
  });

  it('removes backfill support before dropping aggregates in reverse order', async () => {
    const { knex, statements } = createKnex();

    await migration.down(knex);

    expect(statements[0]).toContain('DROP PROCEDURE IF EXISTS backfill_metric_continuous_aggregate');
    expect(statements[1]).toContain('DROP TABLE IF EXISTS metric_continuous_aggregate_backfills');
    expect(statements.slice(2)).toEqual(
      [...aggregateNames].reverse().map((name) => `DROP MATERIALIZED VIEW IF EXISTS ${name};`),
    );
  });

  it('runs outside a transaction', () => {
    expect(migration.config).toEqual({ transaction: false });
  });
});
