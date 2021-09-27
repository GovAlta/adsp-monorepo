/* eslint-disable no-undef */
exports.up = function (knex) {
  const schema = knex.schema.createTable('calendar_events', function (table) {
    table.increments('id');
    table.string('tenant').notNullable();
    table.string('calendar').notNullable();
    table.jsonb('context');
    table.string('name').notNullable();
    table.string('description');
    table.boolean('is_public').notNullable();
    table.boolean('is_all_day').notNullable();
    table.integer('start_date').notNullable();
    table.integer('start_time');
    table.integer('end_date');
    table.integer('end_time');

    table.unique(['tenant', 'id']);
    table.index(['tenant', 'calendar']);
    table.index(['start_date', 'start_time'], 'idx_start_date_time');
    table.index(['end_date', 'end_time'], 'idx_end_date_time');

    table.foreign('start_date').references('id').on('calendar_dates');
    table.foreign('start_time').references('id').on('calendar_times');
    table.foreign('end_date').references('id').on('calendar_dates');
    table.foreign('end_time').references('id').on('calendar_times');
  });

  return schema;
};

exports.down = function (knex) {
  return knex.schema.dropTable('calendar_events');
};
