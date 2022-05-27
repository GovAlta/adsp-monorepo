/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.table('values', function (table) {
    table.index(['tenant', 'namespace', 'name', 'correlationId', 'timestamp'], 'idx_correlation');
  });
};

exports.down = function (knex) {
  return knex.schema.table('values', function (table) {
    table.dropIndex(['tenant', 'namespace', 'name', 'correlationId', 'timestamp'], 'idx_correlation');
  });
};
