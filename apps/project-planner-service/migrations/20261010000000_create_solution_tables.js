/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";').createTable('solutions', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
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
    table.integer('revision').notNullable().defaultTo(1);

    table.index(['tenant', 'createdById'], 'idx_solution_owner');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('solutions');
};
