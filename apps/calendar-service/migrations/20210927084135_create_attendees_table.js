/* eslint-disable no-undef */

exports.up = function (knex) {
  const schema = knex.schema.raw('CREATE EXTENSION IF NOT EXISTS citext;').createTable('attendees', function (table) {
    // Postgres versions 10+
    // table.specificType('id', 'integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY');
    table.increments('id');
    table.string('tenant').notNullable();
    table.integer('event_id').notNullable();
    table.specificType('email', 'citext');
    table.string('name');

    table.unique(['tenant', 'event_id', 'id']);
    table.unique(['event_id', 'email']);
    table.foreign('event_id').references('id').on('calendar_events').onDelete('CASCADE');
  });

  return schema;
};

exports.down = function (knex) {
  return knex.schema.dropTable('attendees');
};
