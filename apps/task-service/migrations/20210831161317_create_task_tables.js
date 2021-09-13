/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    .createTable('tasks', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('tenant').notNullable();
      table.string('queueNamespace').notNullable();
      table.string('queueName').notNullable();
      table.string('definitionNamespace');
      table.string('definitionName');
      table.string('name').notNullable();
      table.string('description');
      table.jsonb('context');
      table.string('recordId');
      table.integer('priority').notNullable();
      table.string('status').notNullable();

      table.timestamp('createdOn').notNullable();
      table.timestamp('startedOn');
      table.timestamp('endedOn');
      table.string('assignedById');
      table.string('assignedByName');
      table.string('assignedTo');
      table.timestamp('assignedOn');

      table.index(['tenant', 'queueNamespace', 'queueName'], 'idx_queue');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable('tasks');
};
