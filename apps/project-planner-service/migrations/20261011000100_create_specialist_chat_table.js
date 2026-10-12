/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.createTable('specialist_chats', function (table) {
    table.uuid('id').primary();
    table.string('tenant').notNullable();
    table.string('service').notNullable();
    table.uuid('solutionId');
    table.string('title').notNullable();
    table.string('createdById').notNullable();
    table.string('createdByName').notNullable();
    table.timestamp('createdOn').notNullable();
    table.timestamp('updatedOn').notNullable();
    table.jsonb('messages').notNullable();

    table.index(['tenant', 'createdById'], 'idx_specialist_chat_owner');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('specialist_chats');
};