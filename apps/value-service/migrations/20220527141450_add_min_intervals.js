/* eslint-disable no-undef */

function createContinuousViews(schema) {
  return schema
    .raw(
      'CREATE VIEW metrics_hourly AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '1 hour', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value),' +
        '   COUNT(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    )
    .raw(
      'CREATE VIEW metrics_daily AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '1 day', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value),' +
        '   COUNT(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    )
    .raw(
      'CREATE VIEW metrics_weekly AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '1 week', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value),' +
        '   COUNT(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    )
    .raw(
      'CREATE VIEW metrics_one_minute AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '1 minute', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value),' +
        '   COUNT(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    )
    .raw(
      'CREATE VIEW metrics_five_minutes AS ' +
        'SELECT namespace, name, tenant, metric,' +
        "   time_bucket(INTERVAL '5 minutes', timestamp) AS bucket," +
        '   AVG(value),' +
        '   SUM(value),' +
        '   MAX(value),' +
        '   MIN(value),' +
        '   COUNT(value)' +
        'FROM metrics ' +
        'GROUP BY namespace, name, tenant, metric, bucket;'
    );
}

exports.up = function (knex) {
  return createContinuousViews(
    knex.schema
      .raw('DROP VIEW "metrics_hourly" CASCADE;')
      .raw('DROP VIEW "metrics_daily" CASCADE;')
      .raw('DROP VIEW "metrics_weekly" CASCADE;')
  );
};

exports.down = function (knex) {
  return knex.schema.raw('DROP VIEW "metrics_one_minute" CASCADE').raw('DROP VIEW "metrics_five_minutes" CASCADE');
};
