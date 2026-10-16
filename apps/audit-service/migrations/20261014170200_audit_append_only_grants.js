/* eslint-disable no-undef */

// Roles are created only when missing. Whether the deployed migration user may CREATE ROLE is an open
// question (OSP-693); if not, a DBA creates the roles first and this migration only applies the grants.
exports.up = async function (knex) {
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_app') THEN
        CREATE ROLE audit_app LOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_retention') THEN
        CREATE ROLE audit_retention LOGIN;
      END IF;
    END
    $$;
  `);

  await knex.raw('GRANT INSERT, SELECT ON audit_events, audit_failed_events TO audit_app');
  await knex.raw('GRANT SELECT, DELETE ON audit_events TO audit_retention');
};

exports.down = async function (knex) {
  await knex.raw('REVOKE ALL ON audit_events, audit_failed_events FROM audit_app, audit_retention');
};
