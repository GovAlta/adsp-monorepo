/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.raw('CREATE INDEX idx_context on ?? USING GIN (?? jsonb_path_ops)', ['values', 'context']);
};

exports.down = function (knex) {
  return knex.schema.alterTable('values', function (table) {
    table.dropUnique([], 'idx_context');
  });
};
