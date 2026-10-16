/* eslint-disable no-undef */

// Serves the cross-namespace listing, which filters on tenant alone and orders by occurred_at.
// The id tiebreaker keeps offset paging stable when events share a timestamp.
exports.up = async function (knex) {
  await knex.raw('CREATE INDEX ix_audit_events_tenant_time ON audit_events (tenant_id, occurred_at DESC, id DESC)');
};

exports.down = function (knex) {
  return knex.raw('DROP INDEX IF EXISTS ix_audit_events_tenant_time');
};
