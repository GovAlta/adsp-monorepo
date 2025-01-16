/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('topics', function (table) {
    table.boolean('requiresAttention');
    table.index('requiresAttention');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('topics', function (table) {
    table.dropIndex('requiresAttention');
    table.dropColumn('requiresAttention');
  });
};
