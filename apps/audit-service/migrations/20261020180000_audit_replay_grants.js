/* eslint-disable no-undef */

exports.up = async function (knex) {
  const { rows } = await knex.raw("SELECT rolname FROM pg_roles WHERE rolname = 'audit_app'");
  if (!rows.length) {
    console.warn('Audit replay migration skipped grants for missing database role: audit_app.');
    return;
  }
  await knex.raw('GRANT UPDATE (status, replayed_as) ON audit_failed_events TO audit_app');
};

exports.down = async function (knex) {
  const { rows } = await knex.raw("SELECT rolname FROM pg_roles WHERE rolname = 'audit_app'");
  if (rows.length) await knex.raw('REVOKE UPDATE (status, replayed_as) ON audit_failed_events FROM audit_app');
};
