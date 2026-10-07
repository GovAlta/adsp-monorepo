#!/usr/bin/env node
// Trims the master realm role mappings of the tenant-management-api's realm admin service account.
//
// Background
// ----------
// When tenant-realm-admin (a master realm client with the create-realm role) creates a realm, Keycloak creates a
// `<realm>-realm` client in master and grants the creator every role on it. Those roles all end up in the service
// account's access token (resource_access), so the token grows with each tenant. Eventually the Authorization header
// is too large for the OpenShift router, which rejects admin API calls with an HTML "400 Bad request".
//
// What this does
// --------------
// For every `<realm>-realm` client in master, the service account is left with only the `manage-realm` role (enough
// to delete the realm); every other role on that client is removed. Specifically it:
//   - assigns `manage-realm` where it is missing,
//   - unassigns all other roles on those clients.
// If the realm a `<realm>-realm` client belongs to no longer exists (checked via the public /auth/realms/<realm>
// endpoint, 404), every role on that client is removed instead, including manage-realm. The client itself is not
// deleted. If the check returns anything other than 200 or 404 the client is skipped with a warning.
// It never touches realm roles (create-realm stays) or roles on clients that aren't `<realm>-realm` clients.
//
// Skipped by default: `master-realm` and `core-realm`. tenant-management-api needs manage-clients on `core` to
// create and delete broker clients, so core must keep its roles. Override with --exclude.
//
// Side effects to be aware of
// ---------------------------
// After trimming, tenant-realm-admin can no longer manage clients/users in the trimmed realms through master.
// Realm deletion still works (needs manage-realm). New realms get a full set of roles from Keycloak when created
// and can be trimmed by re-running this script.
//
// Run with --help for usage, arguments and examples. Dry run unless --apply is passed.

const KEEP_ROLE = 'manage-realm';
const REALM_CLIENT_SUFFIX = '-realm';
const DEFAULT_EXCLUDED = ['master-realm', 'core-realm'];
const PAGE_SIZE = 100;

const USAGE = `
Trims the master realm role mappings of the tenant-management-api's realm admin service account (tenant-realm-admin)
so its access token stops growing with every tenant realm.

For each <realm>-realm client in master, the service account keeps only the manage-realm role (enough to delete the
realm) and every other role on that client is removed. Realm roles such as create-realm are never touched. If the
realm a client belongs to no longer exists, all roles on that client are removed.

Usage:
  node tools/keycloak/trim-tenant-realm-admin-roles.mjs --url <url> --client-id <id> --client-secret <secret> [options]

Required arguments:
  --url <url>              Keycloak root URL, without /auth (e.g. https://access-uat.alberta.ca)
  --client-id <id>         master realm client used to call the admin API
  --client-secret <secret> secret of that client. If omitted, KEYCLOAK_ADMIN_CLIENT_SECRET is used, which keeps the
                           secret out of shell history and the process list.

Options:
  --target-client <id>     client whose service account is trimmed (default: tenant-realm-admin)
  --exclude <a,b>          extra <realm>-realm client ids to skip. master-realm and core-realm are always skipped:
                           tenant-management-api needs manage-clients on core to create and delete broker clients.
  --no-add                 only remove roles; do not grant manage-realm where it is missing
  --apply                  make the changes. Without it the script is a dry run and modifies nothing.
  -h, --help               show this help

Behaviour:
  Best effort: a failure on one realm client is reported and the script carries on with the next. If the manage-realm
  grant fails for a client, its other roles are left in place. The script exits with status 1 if anything failed, and
  is safe to re-run: it reads the current mappings and only changes what is still needed.

Credentials:
  --client-id needs access to the master realm admin API: view-clients, view-users and manage-users on master-realm.
  Granting manage-realm also requires the caller to hold that role itself (e.g. the master admin realm role); without
  it the grant is denied with a 403, so use --no-add and grant manage-realm by hand. Do not use tenant-realm-admin
  itself once its token is oversized: the OpenShift router rejects it with an HTML "400 Bad request". Use another
  credential and/or bypass the router:
    oc port-forward svc/access-service 8080:8080 -n adsp-uat     (then --url http://localhost:8080)

Examples:
  # See what would change
  KEYCLOAK_ADMIN_CLIENT_SECRET=... node tools/keycloak/trim-tenant-realm-admin-roles.mjs \\
    --url http://localhost:8080 --client-id my-admin-client

  # Remove roles only, skipping an extra realm
  KEYCLOAK_ADMIN_CLIENT_SECRET=... node tools/keycloak/trim-tenant-realm-admin-roles.mjs \\
    --url http://localhost:8080 --client-id my-admin-client --no-add --exclude abc-realm --apply
`;

const VALUE_ARGS = {
  '--url': 'url',
  '--client-id': 'clientId',
  '--client-secret': 'clientSecret',
  '--target-client': 'targetClient',
};

function parseArgs(argv) {
  const args = { apply: false, noAdd: false, exclude: [], targetClient: 'tenant-realm-admin' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--apply') {
      args.apply = true;
    } else if (arg === '--no-add') {
      args.noAdd = true;
    } else if (arg === '--exclude') {
      args.exclude = (argv[++i] ?? '').split(',').filter(Boolean);
    } else if (VALUE_ARGS[arg]) {
      const value = argv[++i];
      if (!value || value.startsWith('--')) {
        throw new Error(`Argument ${arg} requires a value.`);
      }
      args[VALUE_ARGS[arg]] = value;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.help) {
    return args;
  }

  args.clientSecret ??= process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;
  for (const [flag, key] of Object.entries(VALUE_ARGS)) {
    if (!args[key]) {
      throw new Error(`Argument ${flag} is required.`);
    }
  }
  return args;
}

/**
 * Decides what to change on a single `<realm>-realm` client.
 *
 * @param {{id: string, name: string}[]} clientRoles all roles defined on the client
 * @param {{id: string, name: string}[]} assigned roles currently assigned to the service account on the client
 * @param {boolean} realmExists whether the realm the client belongs to still exists
 */
export function planClientChanges(clientRoles, assigned, realmExists = true) {
  if (!realmExists) {
    // The realm is gone, so there is nothing left to manage: drop every role, including manage-realm.
    return { missingKeepRole: false, add: [], remove: assigned };
  }

  const keepRole = clientRoles.find((role) => role.name === KEEP_ROLE);
  const hasKeepRole = assigned.some((role) => role.name === KEEP_ROLE);

  return {
    missingKeepRole: !keepRole,
    add: keepRole && !hasKeepRole ? [keepRole] : [],
    remove: assigned.filter((role) => role.name !== KEEP_ROLE),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.log(USAGE);
    return 0;
  }

  const options = parseArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }
  const {
    apply,
    noAdd,
    exclude,
    url,
    clientId: adminClientId,
    clientSecret: adminClientSecret,
    targetClient: targetClientId,
  } = options;
  const rootUrl = url.replace(/\/+$/, '');
  const excluded = new Set([...DEFAULT_EXCLUDED, ...exclude]);

  const adminUrl = `${rootUrl}/auth/admin/realms/master`;

  const tokenResponse = await fetch(`${rootUrl}/auth/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: adminClientId,
      client_secret: adminClientSecret,
    }),
  });
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.status} ${await tokenResponse.text()}`);
  }
  const { access_token: accessToken } = await tokenResponse.json();

  // Show which master-realm roles actually made it into the token. Roles assigned to the client's service account
  // are left out of the token if the client has "Full scope allowed" turned off.
  const tokenClaims = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
  console.log(`Token roles on master-realm: ${(tokenClaims.resource_access?.['master-realm']?.roles ?? []).join(', ') || '(none)'}`);

  async function request(method, path, body) {
    const response = await fetch(`${adminUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
    }
    return response.status === 204 ? null : response.json();
  }

  const [targetClient] = await request('GET', `/clients?clientId=${encodeURIComponent(targetClientId)}`);
  if (!targetClient) {
    throw new Error(`Client '${targetClientId}' not found in master.`);
  }
  const serviceAccount = await request('GET', `/clients/${targetClient.id}/service-account-user`);
  console.log(`Service account: ${serviceAccount.username} (${serviceAccount.id})`);

  const realmClients = [];
  for (let first = 0; ; first += PAGE_SIZE) {
    const page = await request('GET', `/clients?first=${first}&max=${PAGE_SIZE}`);
    realmClients.push(...page.filter((client) => client.clientId.endsWith(REALM_CLIENT_SUFFIX)));
    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  const mappings = await request('GET', `/users/${serviceAccount.id}/role-mappings`);
  const assignedByClient = mappings.clientMappings ?? {};

  // Public endpoint, so no extra role is required. 404 means the realm doesn't exist.
  async function realmExists(realm) {
    const response = await fetch(`${rootUrl}/auth/realms/${encodeURIComponent(realm)}`);
    if (response.status === 404) {
      return false;
    }
    if (!response.ok) {
      throw new Error(`GET /auth/realms/${realm} failed: ${response.status}`);
    }
    return true;
  }

  let added = 0;
  let removed = 0;
  let skipped = 0;
  let clientsChanged = 0;
  const orphans = [];
  const failures = [];

  function fail(client, message) {
    failures.push(client.clientId);
    console.error(`! ${client.clientId}: ${message}`);
  }

  for (const client of realmClients) {
    if (excluded.has(client.clientId)) {
      skipped++;
      continue;
    }

    // Best effort: a problem with one client is reported and the next client is still processed.
    try {
      const realm = client.clientId.slice(0, -REALM_CLIENT_SUFFIX.length);
      let exists;
      try {
        exists = await realmExists(realm);
      } catch (err) {
        // Unclear whether the realm exists (e.g. a 5xx), so leave this client alone.
        fail(client, `${err.message}, skipped.`);
        continue;
      }
      if (!exists) {
        orphans.push(client.clientId);
      }

      const clientRoles = await request('GET', `/clients/${client.id}/roles?first=0&max=1000`);
      const assigned = assignedByClient[client.clientId]?.mappings ?? [];
      const plan = planClientChanges(clientRoles, assigned, exists);
      if (noAdd) {
        plan.add = [];
      }

      if (plan.missingKeepRole) {
        fail(client, `no '${KEEP_ROLE}' role defined, nothing changed.`);
        continue;
      }
      if (plan.add.length === 0 && plan.remove.length === 0) {
        continue;
      }

      console.log(
        `${apply ? '' : '[dry run] '}${client.clientId}: +${plan.add.length} (${KEEP_ROLE}), -${plan.remove.length}` +
          (exists ? '' : ' (realm does not exist, removing all roles)'),
      );

      if (apply) {
        const mappingPath = `/users/${serviceAccount.id}/role-mappings/clients/${client.id}`;
        // Add before removing so the account never ends up with no access to the realm mid-way. If the add fails
        // the error leaves this block, so the removal is not attempted.
        if (plan.add.length > 0) {
          await request('POST', mappingPath, plan.add);
          added += plan.add.length;
        }
        if (plan.remove.length > 0) {
          await request('DELETE', mappingPath, plan.remove);
          removed += plan.remove.length;
        }
      } else {
        added += plan.add.length;
        removed += plan.remove.length;
      }
      clientsChanged++;
    } catch (err) {
      fail(client, err.message);
    }
  }

  console.log(
    `${apply ? 'Applied' : 'Dry run'}: ${clientsChanged} of ${realmClients.length} realm clients changed ` +
      `(+${added} / -${removed} roles), ${skipped} skipped (${[...excluded].join(', ')}).`,
  );
  if (orphans.length > 0) {
    console.log(
      `${orphans.length} realm client(s) have no matching realm: ${orphans.join(', ')}. ` +
        'Their roles are removed; the clients themselves are left in place.',
    );
  }
  if (failures.length > 0) {
    console.error(`${failures.length} realm client(s) failed: ${failures.join(', ')}. See the errors above.`);
  }
  if (!apply && clientsChanged > 0) {
    console.log('Re-run with --apply to make these changes.');
  }

  return failures.length > 0 ? 1 : 0;
}

// Only run when executed directly, so planClientChanges can be imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((err) => {
      console.error(err.message);
      if (/^(Unknown )?[Aa]rgument/.test(err.message)) {
        console.error('Run with --help for usage.');
      }
      process.exitCode = 1;
    });
}
