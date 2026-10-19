/* eslint-disable no-undef */

// Roles are cluster-wide and the database is shared with other services, so this migration does not create
// them. A DBA creates audit_app and audit_retention first; the migration only applies grants on audit tables.
exports.up = async function (knex) {
  const { rows } = await knex.raw("SELECT rolname FROM pg_roles WHERE rolname IN ('audit_app', 'audit_retention')");
  const missing = ['audit_app', 'audit_retention'].filter((role) => !rows.some((row) => row.rolname === role));
  if (missing.length > 0) {
    throw new Error(`Database roles must be created before running audit migrations: ${missing.join(', ')}.`);
  }

  await knex.raw('GRANT INSERT, SELECT ON audit_events, audit_failed_events TO audit_app');
  await knex.raw('GRANT SELECT, DELETE ON audit_events TO audit_retention');
};

exports.down = async function (knex) {
  await knex.raw('REVOKE ALL ON audit_events, audit_failed_events FROM audit_app, audit_retention');
};
