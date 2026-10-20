/* eslint-disable no-undef */

// Roles are cluster-wide and the database is shared with other services, so this migration does not create
// them. A DBA creates audit_app and audit_retention; grants are applied only for roles that already exist.
// A missing role is skipped with a warning so the service can still start. Once recorded, this migration does
// not run again, so grants for a role created later must be applied by the DBA.
async function existingRoles(knex, roles) {
  const { rows } = await knex.raw('SELECT rolname FROM pg_roles WHERE rolname = ANY(?)', [roles]);
  return roles.filter((role) => rows.some((row) => row.rolname === role));
}

function warnSkipped(roles, found) {
  const skipped = roles.filter((role) => !found.includes(role));
  if (skipped.length > 0) {
    console.warn(`Audit migration skipped grants for missing database roles: ${skipped.join(', ')}.`);
  }
}

exports.up = async function (knex) {
  const roles = ['audit_app', 'audit_retention'];
  const found = await existingRoles(knex, roles);
  warnSkipped(roles, found);

  if (found.includes('audit_app')) {
    await knex.raw('GRANT INSERT, SELECT ON audit_events, audit_failed_events TO audit_app');
  }
  if (found.includes('audit_retention')) {
    await knex.raw('GRANT SELECT, DELETE ON audit_events TO audit_retention');
  }
};

exports.down = async function (knex) {
  const found = await existingRoles(knex, ['audit_app', 'audit_retention']);
  for (const role of found) {
    await knex.raw('REVOKE ALL ON audit_events, audit_failed_events FROM ??', [role]);
  }
};
