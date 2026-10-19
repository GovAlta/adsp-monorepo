/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.alterTable('solutions', function (table) {
    table.dropColumn('revision');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('solutions', function (table) {
    table.integer('revision').notNullable().defaultTo(1);
  });
};
