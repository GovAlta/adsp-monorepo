/* eslint-disable no-undef */

const aggregates = [
  'metrics_one_minute_continuous',
  'metrics_five_minutes_continuous',
  'metrics_hourly_continuous',
  'metrics_daily_continuous',
  'metrics_weekly_continuous',
  'metrics_monthly_continuous',
];

// Continuous aggregates never existed on the deployed Apache-licensed databases, but developer
// databases on a Community build have them from the superseded migration. Drop them so every
// environment ends up with the rollup tables as the only aggregation.
const dropContinuousAggregates = async (knex) => {
  await knex.schema.raw(
    'DROP PROCEDURE IF EXISTS backfill_metric_continuous_aggregate(REGCLASS, TIMESTAMPTZ, TIMESTAMPTZ);',
  );
  await knex.schema.raw('DROP TABLE IF EXISTS metric_continuous_aggregate_backfills;');

  for (const aggregate of aggregates) {
    await knex.schema.raw(`DROP MATERIALIZED VIEW IF EXISTS ${aggregate} CASCADE;`);
  }
};

exports.up = async function (knex) {
  await dropContinuousAggregates(knex);

  await knex.schema.createTable('metric_interval_rollups', function (table) {
    table.string('interval').notNullable();
    table.string('namespace').notNullable();
    table.string('name').notNullable();
    table.string('tenant');
    table.string('metric').notNullable();
    table.timestamp('bucket').notNullable();
    table.decimal('sum', null);
    table.integer('count');
    table.decimal('min', null);
    table.decimal('max', null);
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['interval', 'namespace', 'name', 'tenant', 'bucket'], 'idx_metric_interval_rollups_lookup');
  });

  // tenant is nullable on metrics, and a null cannot take part in a primary key, so the upsert
  // conflict target coalesces it. Reads still see the null the metric was written with.
  await knex.schema.raw(
    'CREATE UNIQUE INDEX idx_metric_interval_rollups_key ON metric_interval_rollups ' +
      "(interval, namespace, name, metric, bucket, (COALESCE(tenant, '')));",
  );

  // How far back each interval has been rolled up. Reads fall back to the metrics_* views for any
  // window this does not cover, so the rollups can be populated progressively without a data gap.
  await knex.schema.createTable('metric_interval_rollup_coverage', function (table) {
    table.string('interval').notNullable().primary();
    table.timestamp('covered_from').notNullable();
    table.timestamp('covered_to').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('metric_interval_rollup_coverage');
  await knex.schema.dropTableIfExists('metric_interval_rollups');
};
