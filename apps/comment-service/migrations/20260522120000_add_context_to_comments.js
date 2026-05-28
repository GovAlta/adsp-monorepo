/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('comments', function (table) {
    table.jsonb('context').notNullable().defaultTo(knex.raw("'{}'::jsonb"));
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('comments', function (table) {
    table.dropColumn('context');
  });
};
