/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.createTable('patterns', function (table) {
    table.string('tenant').notNullable();
    table.string('id').notNullable();
    table.jsonb('pattern').notNullable();
    table.string('createdById').notNullable();
    table.string('createdByName').notNullable();
    table.timestamp('createdOn').notNullable();
    table.timestamp('updatedOn').notNullable();

    table.primary(['tenant', 'id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('patterns');
};