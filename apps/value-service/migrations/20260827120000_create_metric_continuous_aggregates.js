/* eslint-disable no-undef */

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
  { name: 'metrics_monthly_continuous', bucket: '1 month', schedule: '1 day', start: '3 months', end: '1 month' },
];

const createAggregate = (knex, aggregate) =>
  knex.schema.raw(
    `CREATE MATERIALIZED VIEW ${aggregate.name} ` +
      'WITH (timescaledb.continuous, timescaledb.materialized_only = true) AS ' +
      'SELECT namespace, name, tenant, metric, ' +
      `time_bucket(INTERVAL '${aggregate.bucket}', timestamp) AS bucket, ` +
      'SUM(value) AS sum, COUNT(value) AS count, MIN(value) AS min, MAX(value) AS max, AVG(value) AS avg ' +
      'FROM metrics GROUP BY namespace, name, tenant, metric, bucket WITH NO DATA;',
  );

const addRefreshPolicy = (knex, aggregate) =>
  knex.schema.raw(
    `SELECT add_continuous_aggregate_policy('${aggregate.name}', ` +
      `start_offset => INTERVAL '${aggregate.start}', ` +
      `end_offset => INTERVAL '${aggregate.end}', ` +
      `schedule_interval => INTERVAL '${aggregate.schedule}');`,
  );

exports.up = async function (knex) {
  for (const aggregate of aggregates) {
    await createAggregate(knex, aggregate);
    await addRefreshPolicy(knex, aggregate);
  }

  await knex.schema.raw(`
    CREATE TABLE metric_continuous_aggregate_backfills (
      aggregate_name TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      window_end TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (aggregate_name, window_start, window_end)
    );

    CREATE PROCEDURE backfill_metric_continuous_aggregate(
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
  await knex.schema.raw('DROP PROCEDURE backfill_metric_continuous_aggregate(REGCLASS, TIMESTAMPTZ, TIMESTAMPTZ);');
  await knex.schema.raw('DROP TABLE metric_continuous_aggregate_backfills;');

  for (const aggregate of [...aggregates].reverse()) {
    await knex.schema.raw(`DROP MATERIALIZED VIEW ${aggregate.name};`);
  }
};

exports.config = { transaction: false };
