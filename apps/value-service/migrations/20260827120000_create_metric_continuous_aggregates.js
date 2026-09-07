/* eslint-disable no-undef */
// clean-code-ignore: RULE-19 - covered by src/timescale/metric-continuous-aggregates-migration.spec.ts.
// The test cannot be colocated: knex loads every .js in this directory as a migration, so a test file
// here fails the migration run at startup.

const aggregates = [
  {
    name: 'metrics_one_minute_continuous',
    bucket: '1 minute',
    schedule: '1 minute',
    start: '10 minutes',
    end: '1 minute',
  },
  {
    name: 'metrics_five_minutes_continuous',
    bucket: '5 minutes',
    schedule: '5 minutes',
    start: '30 minutes',
    end: '5 minutes',
  },
  { name: 'metrics_hourly_continuous', bucket: '1 hour', schedule: '15 minutes', start: '3 hours', end: '1 hour' },
  { name: 'metrics_daily_continuous', bucket: '1 day', schedule: '1 hour', start: '3 days', end: '1 day' },
  { name: 'metrics_weekly_continuous', bucket: '1 week', schedule: '1 day', start: '3 weeks', end: '1 week' },
  // A month is a variable-width bucket, so Timescale requires the refresh window to span more than two
  // of them rather than the exactly-two the fixed-width buckets above get away with; '3 months' here
  // is rejected with 'policy refresh window too small'.
  { name: 'metrics_monthly_continuous', bucket: '1 month', schedule: '1 day', start: '4 months', end: '1 month' },
];

// Timescale cannot create continuous aggregates inside a transaction, so this migration runs unwrapped
// (see exports.config below) and every statement has to be safe to re-run: a failure part way through
// leaves the earlier statements applied, and knex will start again from the top on the next boot.
const createAggregate = (knex, aggregate) =>
  knex.schema.raw(
    `CREATE MATERIALIZED VIEW IF NOT EXISTS ${aggregate.name} ` +
      'WITH (timescaledb.continuous) AS ' +
      'SELECT namespace, name, tenant, metric, ' +
      `time_bucket(INTERVAL '${aggregate.bucket}', timestamp) AS bucket, ` +
      'SUM(value) AS sum, COUNT(value) AS count, MIN(value) AS min, MAX(value) AS max ' +
      'FROM metrics GROUP BY namespace, name, tenant, metric, bucket WITH NO DATA;',
  );

// IF NOT EXISTS above skips an aggregate left behind by an earlier attempt, which would otherwise keep
// whatever settings that attempt created it with. Set them explicitly so the end state is the same
// whether the view is new or pre-existing.
const setAggregateOptions = (knex, aggregate) =>
  knex.schema.raw(`ALTER MATERIALIZED VIEW ${aggregate.name} SET (timescaledb.materialized_only = false);`);

const addRefreshPolicy = (knex, aggregate) =>
  knex.schema.raw(
    `SELECT add_continuous_aggregate_policy('${aggregate.name}', ` +
      `start_offset => INTERVAL '${aggregate.start}', ` +
      `end_offset => INTERVAL '${aggregate.end}', ` +
      `schedule_interval => INTERVAL '${aggregate.schedule}', ` +
      'if_not_exists => TRUE);',
  );

exports.up = async function (knex) {
  for (const aggregate of aggregates) {
    await createAggregate(knex, aggregate);
    await setAggregateOptions(knex, aggregate);
    await addRefreshPolicy(knex, aggregate);
  }

  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS metric_continuous_aggregate_backfills (
      aggregate_name TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      window_end TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (aggregate_name, window_start, window_end)
    );

    CREATE OR REPLACE PROCEDURE backfill_metric_continuous_aggregate(
      p_aggregate REGCLASS,
      p_window_start TIMESTAMPTZ,
      p_window_end TIMESTAMPTZ
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
      aggregate_name TEXT := p_aggregate::TEXT;
      allowed_aggregates CONSTANT TEXT[] := ARRAY[
        'metrics_one_minute_continuous',
        'metrics_five_minutes_continuous',
        'metrics_hourly_continuous',
        'metrics_daily_continuous',
        'metrics_weekly_continuous',
        'metrics_monthly_continuous'
      ];
    BEGIN
      IF aggregate_name <> ALL(allowed_aggregates) THEN
        RAISE EXCEPTION 'Unsupported metric continuous aggregate: %', aggregate_name;
      END IF;

      IF p_window_start >= p_window_end THEN
        RAISE EXCEPTION 'Backfill window start must be before its end';
      END IF;

      IF p_window_end - p_window_start > INTERVAL '31 days' THEN
        RAISE EXCEPTION 'Backfill window cannot exceed 31 days';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM metric_continuous_aggregate_backfills backfill
        WHERE backfill.aggregate_name = aggregate_name
          AND backfill.window_start = p_window_start
          AND backfill.window_end = p_window_end
      ) THEN
        RETURN;
      END IF;

      CALL refresh_continuous_aggregate(p_aggregate, p_window_start, p_window_end);

      INSERT INTO metric_continuous_aggregate_backfills (aggregate_name, window_start, window_end)
      VALUES (aggregate_name, p_window_start, p_window_end)
      ON CONFLICT DO NOTHING;
    END;
    $$;
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(
    'DROP PROCEDURE IF EXISTS backfill_metric_continuous_aggregate(REGCLASS, TIMESTAMPTZ, TIMESTAMPTZ);',
  );
  await knex.schema.raw('DROP TABLE IF EXISTS metric_continuous_aggregate_backfills;');

  for (const aggregate of [...aggregates].reverse()) {
    await knex.schema.raw(`DROP MATERIALIZED VIEW IF EXISTS ${aggregate.name};`);
  }
};

exports.config = { transaction: false };
