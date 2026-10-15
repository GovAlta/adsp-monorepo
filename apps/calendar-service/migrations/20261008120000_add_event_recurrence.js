const EVENTS_TABLE = 'calendar_events';
const EXCLUSIONS_TABLE = 'calendar_event_exclusions';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .table(EVENTS_TABLE, (table) => {
      table.jsonb('recurrence');
      table.integer('recurrence_end_date');
    })
    .createTable(EXCLUSIONS_TABLE, (table) => {
      table.string('tenant').notNullable();
      table.integer('event_id').notNullable();
      table.integer('occurrence_date').notNullable();

      table.primary(['tenant', 'event_id', 'occurrence_date']);
      table.foreign('event_id').references('id').on(EVENTS_TABLE).onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(EXCLUSIONS_TABLE).table(EVENTS_TABLE, (table) => {
    table.dropColumn('recurrence_end_date');
    table.dropColumn('recurrence');
  });
};
