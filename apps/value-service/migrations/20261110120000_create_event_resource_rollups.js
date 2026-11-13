/* eslint-disable no-undef */ // clean-code-ignore: RULE-19 — covered by src/timescale/event-resource-rollups-migration.spec.ts, where the other migration specs live.

// Which resources each tenant's events named, one row per day, event and resource. A distinct count
// does not compose -- a template used on two days is one template, not two -- so the rollup keeps
// the members rather than a count, and a period's distinct count is a COUNT(DISTINCT) over its days.
exports.up = async function (knex) {
  await knex.schema.createTable('event_resource_rollups', function (table) {
    table.timestamp('bucket').notNullable();
    table.string('tenant').notNullable();
    table.string('namespace').notNullable();
    table.string('name').notNullable();
    table.string('context_key').notNullable();
    table.text('resource').notNullable();
    table.integer('count').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.primary(['bucket', 'tenant', 'namespace', 'name', 'context_key', 'resource']);
    table.index(['tenant', 'namespace', 'context_key', 'bucket'], 'idx_event_resource_rollups_lookup');
  });

  // How far back each resource has been rolled up, per source rather than for the table as a whole,
  // so a source added later backfills its own history without the others claiming it.
  await knex.schema.createTable('event_resource_rollup_coverage', function (table) {
    table.string('namespace').notNullable();
    table.string('context_key').notNullable();
    table.timestamp('covered_from').notNullable();
    table.timestamp('covered_to').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.primary(['namespace', 'context_key']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('event_resource_rollup_coverage');
  await knex.schema.dropTableIfExists('event_resource_rollups');
};
