/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.table('tasks', function (table) {
    table.jsonb('data');
  });
};

exports.down = function (knex) {
  return knex.schema.table('tasks', function (table) {
    table.dropColumn('data');
  });
};
