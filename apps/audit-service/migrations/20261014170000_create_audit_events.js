/* eslint-disable no-undef */

exports.up = async function (knex) {
  await knex.schema.createTable('audit_events', function (table) {
    table.uuid('id').primary();
    table.uuid('event_id').notNullable();
    table.text('tenant_id').notNullable();
    table.text('namespace').notNullable();
    table.text('written_by').notNullable();

    table.timestamp('occurred_at', { useTz: true }).notNullable();
    table.timestamp('received_at', { useTz: true }).notNullable();

    table.text('action').notNullable();
    table.integer('action_version').notNullable();
    table.text('category').notNullable();
    table.text('status').notNullable();
    table.text('severity').notNullable();

    table.text('actor_id').notNullable();
    table.text('actor_type').notNullable();
    table.text('actor_name');
    table.text('actor_email');
    table.specificType('actor_roles', 'text[]').notNullable().defaultTo(knex.raw("'{}'"));

    table.text('resource_type');
    table.text('resource_id');
    table.text('resource_name');
    table.specificType('scope_ids', 'text[]').notNullable().defaultTo(knex.raw("'{}'"));

    table.text('correlation_id');
    table.string('session_id', 128);

    table.jsonb('change_set_before');
    table.jsonb('change_set_after');
    table.jsonb('metadata').notNullable().defaultTo(knex.raw("'{}'::jsonb"));

    table.text('retention_class').notNullable();
    table.timestamp('retention_until', { useTz: true }).notNullable();

    table.unique(['tenant_id', 'namespace', 'event_id'], { indexName: 'uq_audit_events_event' });
    table.index(['correlation_id'], 'ix_audit_events_correlation');
    table.index(['retention_until'], 'ix_audit_events_retention');
  });

  // Indexes with DESC ordering or GIN are not expressible through the schema builder.
  await knex.raw('CREATE INDEX ix_audit_events_ns_time ON audit_events (tenant_id, namespace, occurred_at DESC)');
  await knex.raw(
    'CREATE INDEX ix_audit_events_resource ON audit_events (tenant_id, resource_type, resource_id, occurred_at DESC)'
  );
  await knex.raw('CREATE INDEX ix_audit_events_actor ON audit_events (tenant_id, actor_id, occurred_at DESC)');
  await knex.raw(
    'CREATE INDEX ix_audit_events_action ON audit_events (tenant_id, namespace, action, occurred_at DESC)'
  );
  await knex.raw('CREATE INDEX ix_audit_events_scope ON audit_events USING GIN (scope_ids)');
};

exports.down = function (knex) {
  return knex.schema.dropTable('audit_events');
};
