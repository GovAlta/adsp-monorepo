/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema
    .createTable('metrics', function (table) {
      table.string('namespace').notNullable();
      table.string('name').notNullable();
      table.string('tenant');
      table.string('metric').notNullable();
      table.timestamp('timestamp').notNullable();
      table.decimal('value').notNullable();

      table.index(['namespace', 'name', 'metric'], 'idx_namespace_name_metric');
      table.index(['tenant'], 'idx_metric_tenant');
    })
    .raw("SELECT create_hypertable('metrics', 'timestamp')")
    .raw(
      'CREATE VIEW metrics_hourly' +
        '   WITH (timescaledb.continuous) AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '1 hour', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    )
    .raw(
      'CREATE VIEW metrics_daily' +
        '   WITH (timescaledb.continuous) AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '1 day', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    )
    .raw(
      'CREATE VIEW metrics_weekly' +
        '   WITH (timescaledb.continuous) AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '1 week', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    );
};

exports.down = function (knex) {
  return knex.schema
    .raw('DROP VIEW metrics_hourly CASCADE')
    .raw('DROP VIEW metrics_daily CASCADE')
    .raw('DROP VIEW metrics_weekly CASCADE')
    .dropTable('metrics');
};
