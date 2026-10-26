/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.alterTable('audit_events', function (table) {
    table.index(['tenant_id', 'retention_until', 'id'], 'ix_audit_events_tenant_retention');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('audit_events', function (table) {
    table.dropIndex(['tenant_id', 'retention_until', 'id'], 'ix_audit_events_tenant_retention');
  });
};
