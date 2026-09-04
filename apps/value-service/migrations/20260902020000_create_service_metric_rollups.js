/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.createTable('service_metric_rollups', function (table) {
    table.date('day').notNullable();
    table.string('tenant').notNullable();
    table.string('service').notNullable();
    table.integer('initiated');
    table.integer('succeeded');
    table.integer('failure_events');
    table.integer('unreconciled');
    table.decimal('duration_sum', null);
    table.integer('duration_count');
    table.decimal('duration_max', null);
    table.integer('distinct_resources');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.primary(['day', 'tenant', 'service']);
    table.index(['tenant', 'service', 'day'], 'idx_service_metric_rollups_lookup');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('service_metric_rollups');
};
