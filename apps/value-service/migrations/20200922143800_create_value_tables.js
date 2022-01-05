/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema
    .raw('ALTER EXTENSION timescaledb UPDATE;')
    .raw('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;')
    .createTable('values', function (table) {
      table.string('namespace').notNullable();
      table.string('name').notNullable();
      table.string('tenant');
      table.timestamp('timestamp').notNullable();
      table.string('correlationId');
      table.jsonb('context');
      table.jsonb('value');

      table.index(['namespace', 'name'], 'idx_namespace_name');
      table.index(['tenant'], 'idx_tenant');
    })
    .raw("SELECT create_hypertable('values', 'timestamp')");
};

exports.down = function (knex) {
  return knex.schema.dropTable('values');
};
