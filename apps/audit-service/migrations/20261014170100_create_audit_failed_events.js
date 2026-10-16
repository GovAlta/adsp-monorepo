/* eslint-disable no-undef */

exports.up = async function (knex) {
  await knex.schema.createTable('audit_failed_events', function (table) {
    table.uuid('id').primary();
    table.text('tenant_id').notNullable();
    table.text('namespace').notNullable();
    table.uuid('event_id');
    table.jsonb('event').notNullable();
    table.text('error').notNullable();
    table.integer('attempts').notNullable();
    table.timestamp('failed_at', { useTz: true }).notNullable();
    table.text('status').notNullable();
    table.uuid('replayed_as').references('id').inTable('audit_events');
  });

  // Partial index: the alert's "any open rows?" query only ever looks at open rows.
  await knex.raw("CREATE INDEX ix_audit_failed_events_open ON audit_failed_events (failed_at) WHERE status = 'open'");
};

exports.down = function (knex) {
  return knex.schema.dropTable('audit_failed_events');
};
