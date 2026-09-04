/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.raw(
    'CREATE VIEW metrics_monthly AS ' +
      'SELECT namespace, name, tenant, metric,' +
      "   time_bucket(INTERVAL '1 month', timestamp) AS bucket," +
      '   AVG(value),' +
      '   SUM(value),' +
      '   MAX(value),' +
      '   MIN(value),' +
      '   COUNT(value)' +
      'FROM metrics ' +
      'GROUP BY namespace, name, tenant, metric, bucket;'
  );
};

exports.down = function (knex) {
  return knex.schema.raw('DROP VIEW "metrics_monthly" CASCADE;');
};
