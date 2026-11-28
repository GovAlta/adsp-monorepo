#!/usr/bin/env node
// Creates the per-realm client scopes of the client secret rotation notice job (CS-5845).
//
// The job signs in to the master realm as a service account that holds the master `admin` role, with "Full scope
// allowed" turned off. It asks for one realm's scope per token (`<prefix><realm>`), and that scope holds only the
// rotation notice roles of the realm's `<realm>-realm` client. No token carries roles for every realm, so none grows
// too large for the OpenShift router however many realms exist. New realms get their scope from createRealm
// (createRotationNoticeScope in apps/tenant-management-api/src/keycloak/keycloak.ts); this script covers the realms
// that already exist and repairs a missed one. Only what is missing is added, so it is safe to re-run.
//
// Run with --help for usage. Dry run unless --apply is passed.

/* global fetch */
import { pathToFileURL, URLSearchParams } from 'node:url';

export const MASTER_REALM = 'master';
export const DEFAULT_NOTICE_JOB_CLIENT_ID = 'tenant-client-secret-rotation-notifier';
export const DEFAULT_SCOPE_PREFIX = 'rotation-notice-';
// Duplicated from ROTATION_NOTICE_JOB_REALM_ROLES in apps/tenant-management-api/src/keycloak/configuration.ts.
export const ROLES = ['view-realm', 'view-clients', 'query-clients', 'manage-clients'];
const REALM_CLIENT_SUFFIX = '-realm';
const DEFAULT_EXCLUDED = ['master', 'core'];
const PAGE_SIZE = 100;

const USAGE = `
Creates a ${DEFAULT_SCOPE_PREFIX}<realm> optional client scope in master for every tenant realm, holding ${ROLES.join(', ')}
of that realm's <realm>-realm client, and attaches it to the notice job's client.

Usage:
  node tools/keycloak/setup-rotation-notice-scopes.mjs --url <url> --client-id <id> [options]

Required arguments:
  --url <url>              Keycloak root URL, without /auth (e.g. https://access-uat.alberta.ca)
  --client-id <id>         master realm client used to call the admin API: the scope admin client, which holds only
                             manage-clients and view-clients on master-realm
  --client-secret <secret> secret of that client. If omitted, KEYCLOAK_ADMIN_CLIENT_SECRET is used.

Options:
  --notifier-client-id <id> the notice job's master realm client (default: ${DEFAULT_NOTICE_JOB_CLIENT_ID})
  --scope-prefix <prefix>  scope name prefix (default: ${DEFAULT_SCOPE_PREFIX}). Must match
                           CLIENT_SECRET_ROTATION_NOTICE_JOB_SCOPE_PREFIX of the API.
  --realms <a,b>           only process these realms (default: every realm except master and core)
  --exclude <a,b>          extra realms to skip. master and core are always skipped.
  --apply                  make the changes. Without it the script is a dry run and modifies nothing.
  -h, --help               show this help

One-time setup of the notice job's client in the master realm admin console:
  1. Create it as a confidential client with a service account.
  2. Clients > <client> > Client scopes > <client>-dedicated > Scope: turn "Full scope allowed" off.
  3. Service account roles: assign the master realm role admin.

Credentials:
  --client-id needs manage-clients and view-clients on the master realm. Do not use tenant-realm-admin, whose roles
  are trimmed.
`;

const VALUE_ARGS = {
  '--url': 'url',
  '--client-id': 'clientId',
  '--client-secret': 'clientSecret',
  '--notifier-client-id': 'notifierClientId',
  '--scope-prefix': 'scopePrefix',
  '--realms': 'realms',
  '--exclude': 'exclude',
};
const REQUIRED = ['url', 'clientId', 'clientSecret'];

export function parseArgs(argv, env = process.env) {
  const args = { apply: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--apply') {
      args.apply = true;
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

  args.clientSecret ??= env.KEYCLOAK_ADMIN_CLIENT_SECRET;
  args.notifierClientId ??= DEFAULT_NOTICE_JOB_CLIENT_ID;
  args.scopePrefix ??= DEFAULT_SCOPE_PREFIX;
  for (const key of REQUIRED) {
    if (!args[key]) {
      const flag = Object.keys(VALUE_ARGS).find((f) => VALUE_ARGS[f] === key);
      throw new Error(`Argument ${flag} is required.`);
    }
  }

  const split = (value) =>
    (value ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  args.realms = split(args.realms);
  args.exclude = split(args.exclude);
  return args;
}

/** What is missing for one realm: the scope, its role mappings, and its link to the notice job's client. */
export function planRealmScope({ scope, mappedRoleNames = [], realmClientRoles = [], attachedScopeIds = new Set() }) {
  const mapped = new Set(mappedRoleNames);
  return {
    createScope: !scope,
    addRoles: realmClientRoles.filter((role) => ROLES.includes(role.name) && !mapped.has(role.name)),
    attach: !scope || !attachedScopeIds.has(scope.id),
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
  const { apply, url, clientId, clientSecret, notifierClientId, scopePrefix } = options;
  const rootUrl = url.replace(/\/+$/, '');
  const excluded = new Set([...DEFAULT_EXCLUDED, ...options.exclude]);
  const prefix = apply ? '' : '[dry run] ';

  let accessToken;
  let expiresAt = 0;
  // Master access tokens are short-lived and a run over many realms can outlast one, so renew shortly before expiry.
  async function currentToken() {
    if (Date.now() < expiresAt - 30_000) {
      return accessToken;
    }
    const tokenResponse = await fetch(`${rootUrl}/auth/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
    });
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${await tokenResponse.text()}`);
    }
    const token = await tokenResponse.json();
    accessToken = token.access_token;
    expiresAt = Date.now() + token.expires_in * 1000;
    return accessToken;
  }

  async function request(method, path, body) {
    const response = await fetch(`${rootUrl}/auth/admin${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await currentToken()}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
    }
    return response;
  }
  const get = async (path) => (await request('GET', path)).json();

  const master = `/realms/${MASTER_REALM}`;
  const clients = [];
  for (let first = 0; ; first += PAGE_SIZE) {
    const page = await get(`${master}/clients?first=${first}&max=${PAGE_SIZE}`);
    clients.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  const notifier = clients.find((client) => client.clientId === notifierClientId);
  if (!notifier) {
    throw new Error(`Client '${notifierClientId}' not found in the master realm. Create it first (see --help).`);
  }
  if (notifier.fullScopeAllowed !== false) {
    console.error(
      `Warning: '${notifierClientId}' has "Full scope allowed" on, so its tokens still carry every role and the ` +
        'scopes have no effect.',
    );
  }

  let realms = options.realms;
  if (realms.length === 0) {
    realms = (await get('/realms')).map((r) => r.realm);
  }
  realms = realms.filter((realm) => !excluded.has(realm)).sort();

  const scopesByName = new Map((await get(`${master}/client-scopes`)).map((scope) => [scope.name, scope]));
  const attachedScopeIds = new Set(
    (await get(`${master}/clients/${notifier.id}/optional-client-scopes`)).map((scope) => scope.id),
  );

  let changed = 0;
  const failures = [];
  for (const realm of realms) {
    const scopeName = `${scopePrefix}${realm}`;
    // Best effort: a problem with one realm is reported and the next realm is still processed.
    try {
      const realmClient = clients.find((client) => client.clientId === `${realm}${REALM_CLIENT_SUFFIX}`);
      if (!realmClient) {
        throw new Error(`client '${realm}${REALM_CLIENT_SUFFIX}' not found in master`);
      }

      let scope = scopesByName.get(scopeName);
      const mappedRoleNames = scope
        ? (await get(`${master}/client-scopes/${scope.id}/scope-mappings/clients/${realmClient.id}`)).map(
            (role) => role.name,
          )
        : [];
      const realmClientRoles = await get(`${master}/clients/${realmClient.id}/roles`);
      const plan = planRealmScope({ scope, mappedRoleNames, realmClientRoles, attachedScopeIds });
      if (!plan.createScope && plan.addRoles.length === 0 && !plan.attach) {
        console.log(`${prefix}${scopeName}: already set up`);
        continue;
      }

      changed++;
      console.log(
        `${prefix}${scopeName}: ${apply ? '' : 'would '}` +
          [
            plan.createScope && 'create',
            plan.addRoles.length > 0 && `map [${plan.addRoles.map((role) => role.name).join(', ')}]`,
            plan.attach && `attach to ${notifierClientId}`,
          ]
            .filter(Boolean)
            .join(', '),
      );
      if (!apply) {
        continue;
      }

      if (plan.createScope) {
        const created = await request('POST', `${master}/client-scopes`, {
          name: scopeName,
          protocol: 'openid-connect',
          attributes: { 'include.in.token.scope': 'false', 'display.on.consent.screen': 'false' },
        });
        scope = { id: created.headers.get('location').split('/').pop(), name: scopeName };
      }
      if (plan.addRoles.length > 0) {
        await request(
          'POST',
          `${master}/client-scopes/${scope.id}/scope-mappings/clients/${realmClient.id}`,
          plan.addRoles.map(({ id, name }) => ({ id, name })),
        );
      }
      if (plan.attach) {
        await request('PUT', `${master}/clients/${notifier.id}/optional-client-scopes/${scope.id}`);
      }
    } catch (err) {
      failures.push(realm);
      console.error(`! ${realm}: failed: ${err.message}`);
    }
  }

  console.log(
    `${apply ? 'Applied' : 'Dry run'}: ${realms.length} realms, ${changed} ${apply ? 'changed' : 'to change'}, ` +
      `${failures.length} failed. Skipped: ${[...excluded].join(', ')}.`,
  );
  if (failures.length > 0) {
    console.error(`${failures.length} realm(s) failed: ${failures.join(', ')}. See the errors above.`);
  }
  if (!apply && changed > 0) {
    console.log('Re-run with --apply to make these changes.');
  }
  return failures.length > 0 ? 1 : 0;
}

// Only run when executed directly, so the helpers can be imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
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
