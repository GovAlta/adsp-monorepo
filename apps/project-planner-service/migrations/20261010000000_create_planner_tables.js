/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema
    .createTable('solutions', function (table) {
      table.uuid('id').primary();
      table.string('tenant').notNullable();
      table.string('name').notNullable();
      table.string('description');
      table.string('scenario').notNullable();
      table.string('status').notNullable();
      table.string('createdById').notNullable();
      table.string('createdByName').notNullable();
      table.timestamp('createdOn').notNullable();
      table.timestamp('updatedOn').notNullable();
      // Structured solution state: business model, hypotheses, decisions, questions, specialists, artifacts.
      table.jsonb('state').notNullable();

      table.index(['tenant', 'createdById'], 'idx_solution_owner');
    })
    .createTable('patterns', function (table) {
      table.string('tenant').notNullable();
      table.string('id').notNullable();
      table.jsonb('pattern').notNullable();
      table.string('createdById').notNullable();
      table.string('createdByName').notNullable();
      table.timestamp('createdOn').notNullable();
      table.timestamp('updatedOn').notNullable();

      table.primary(['tenant', 'id']);
    })
    .createTable('specialist_chats', function (table) {
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
  return knex.schema.dropTable('specialist_chats').dropTable('patterns').dropTable('solutions');
};
