#!/usr/bin/env node
// Brings the `urn:ads:platform:adsp-mcp` client in every existing tenant realm to the server-only configuration (CS-5765).
//
// For each tenant realm it:
//   - adds the `urn:ads:platform:adsp-mcp` client where it is missing,
//   - updates its settings, redirect URIs and web origins where it exists but differs,
//   - adds missing configuration-admin scope mappings (same as createRealm),
//   - reports whether the realm's `core` identity provider exists and is enabled. It never creates one.
// A realm that already matches is left untouched, so the script is safe to re-run after a partial failure.
//
// The client definition is duplicated from createAdspMcpPublicClientConfig in
// apps/tenant-management-api/src/keycloak/configuration.ts.
// Later adsp-mcp changes for existing realms (CS-5756, CS-5772) go through createAdspMcpClient and SCOPE_MAPPINGS.
//
// Run with --help for usage. Dry run unless --apply is passed.

/* global fetch */
import { pathToFileURL, URL, URLSearchParams } from 'node:url';

export const ADSP_MCP_CLIENT_ID = 'urn:ads:platform:adsp-mcp';
const DEFAULT_EXCLUDED = ['master', 'core'];
const CORE_IDP_ALIAS = 'core';

export const SCOPE_MAPPINGS = [{ client: 'urn:ads:platform:configuration-service', roles: ['configuration-admin'] }];

const USAGE = `
Backfills the server-only 'urn:ads:platform:adsp-mcp' client into every existing tenant realm.

Usage:
  node tools/keycloak/backfill-adsp-mcp-client.mjs --url <url> --client-id <id> --callback-urls <urls> [options]

Required arguments:
  --url <url>              Keycloak root URL, without /auth (e.g. https://access-uat.alberta.ca)
  --client-id <id>         master realm client used to call the admin API
  --client-secret <secret> secret of that client. If omitted, KEYCLOAK_ADMIN_CLIENT_SECRET is used, which keeps the
                           secret out of shell history and the process list.
  --callback-urls <urls>   comma separated MCP server callbacks for this environment. These become the client's only
                           redirect URIs. Production: https://<public-url>/oauth/callback only.
                           Dev and UAT: that URL plus http://localhost:<port>/oauth/callback.

Options:
  --realms <a,b>           only process these realms (default: every realm except master and core)
  --exclude <a,b>          extra realms to skip. master and core are always skipped.
  --apply                  make the changes. Without it the script is a dry run and modifies nothing.
  -h, --help               show this help

Behaviour:
  Best effort: a failure on one realm is reported and the next realm is still processed. Exits with status 1 if any
  realm failed. Realms whose 'core' identity provider is missing or disabled are listed at the end; they are not
  changed. Realms that are not tenant realms show up there too, so use --exclude or --realms to skip them.

Credentials:
  --client-id needs rights on every tenant realm: view-realm, view-clients, manage-clients. Do not use
  tenant-realm-admin, whose roles are trimmed. To bypass the router:
    oc port-forward svc/access-service 8080:8080 -n adsp-uat     (then --url http://localhost:8080)

Examples:
  # See what would change in UAT
  KEYCLOAK_ADMIN_CLIENT_SECRET=... node tools/keycloak/backfill-adsp-mcp-client.mjs \\
    --url http://localhost:8080 --client-id my-admin-client \\
    --callback-urls https://mcp.adsp-uat.alberta.ca/oauth/callback,http://localhost:3000/oauth/callback

  # Apply to a single realm
  ... --realms my-tenant --apply
`;

const VALUE_ARGS = {
  '--url': 'url',
  '--client-id': 'clientId',
  '--client-secret': 'clientSecret',
  '--callback-urls': 'callbackUrls',
  '--realms': 'realms',
  '--exclude': 'exclude',
};
const REQUIRED = ['url', 'clientId', 'clientSecret', 'callbackUrls'];

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
  args.callbackUrls = split(args.callbackUrls);
  args.realms = split(args.realms);
  args.exclude = split(args.exclude);
  for (const callback of args.callbackUrls) {
    validateCallbackUrl(callback);
  }
  if (args.callbackUrls.length === 0) {
    throw new Error('Argument --callback-urls requires at least one URL.');
  }
  return args;
}

export function validateCallbackUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid callback URL: ${value}`);
  }
  if (value.includes('*')) {
    throw new Error(`Callback URL must be exact, no wildcards: ${value}`);
  }
  const isLocalhost = url.hostname === 'localhost';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost)) {
    throw new Error(`Callback URL must be https (http only for localhost): ${value}`);
  }
}

/** The server-only tenant-realm client. Mirrors createAdspMcpPublicClientConfig. */
export function createAdspMcpClient(callbackUrls) {
  return {
    clientId: ADSP_MCP_CLIENT_ID,
    enabled: true,
    publicClient: true,
    standardFlowEnabled: true,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    serviceAccountsEnabled: false,
    consentRequired: true,
    fullScopeAllowed: true,
    attributes: {
      'pkce.code.challenge.method': 'S256',
      'access.token.lifespan': '600',
      'client.session.idle.timeout': '3600',
    },
    redirectUris: callbackUrls,
    webOrigins: [],

    description:
      'Public client for the hosted ADSP SDK MCP server signing in to tenant realms. PKCE-only, consent required. ' +
      'Scope restricted to configuration-admin via clientScopeMappings.',
  };
}

const sameSet = (a = [], b = []) => a.length === b.length && new Set([...a, ...b]).size === a.length;

const CLIENT_SETTINGS = [
  'enabled',
  'publicClient',
  'standardFlowEnabled',
  'implicitFlowEnabled',
  'directAccessGrantsEnabled',
  'serviceAccountsEnabled',
  'consentRequired',
  'fullScopeAllowed',
  'description',
];

/**
 * Compares an existing client with the desired one.
 * @returns {{action: 'add'|'update'|'match', changes: string[], settingsChanged: boolean}}
 */
export function planClient(existing, desired) {
  if (!existing) {
    return { action: 'add', changes: [], settingsChanged: false };
  }

  const changes = CLIENT_SETTINGS.filter((key) => existing[key] !== desired[key]);
  for (const key of ['redirectUris', 'webOrigins']) {
    if (!sameSet(existing[key], desired[key])) {
      changes.push(key);
    }
  }
  for (const [key, value] of Object.entries(desired.attributes)) {
    if (existing.attributes?.[key] !== value) {
      changes.push(`attributes.${key}`);
    }
  }
  const settingsChanged = changes.length > 0;

  return {
    action: changes.length > 0 ? 'update' : 'match',
    changes,
    settingsChanged,
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
  const { apply, url, clientId, clientSecret, callbackUrls } = options;
  const rootUrl = url.replace(/\/+$/, '');
  const excluded = new Set([...DEFAULT_EXCLUDED, ...options.exclude]);
  const prefix = apply ? '' : '[dry run] ';

  const tokenResponse = await fetch(`${rootUrl}/auth/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.status} ${await tokenResponse.text()}`);
  }
  const { access_token: accessToken } = await tokenResponse.json();

  // Returns the response so callers can treat 404 as an answer rather than an error.
  async function call(method, path, body) {
    return fetch(`${rootUrl}/auth/admin${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function request(method, path, body) {
    const response = await call(method, path, body);
    if (!response.ok) {
      throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
    }
    return response.status === 204 || response.status === 201 ? null : response.json();
  }

  const findClient = async (base, id) =>
    (await request('GET', `${base}/clients?clientId=${encodeURIComponent(id)}`)).find((c) => c.clientId === id);

  /** Scope mapping roles that the client doesn't have yet. Source clients absent from the realm are skipped. */
  async function planScopeMappings(base, clientUuid) {
    const plan = [];
    for (const mapping of SCOPE_MAPPINGS) {
      const source = await findClient(base, mapping.client);
      if (!source) {
        continue;
      }
      const assigned = clientUuid
        ? await request('GET', `${base}/clients/${clientUuid}/scope-mappings/clients/${source.id}`)
        : [];
      const assignedNames = new Set(assigned.map((r) => r.name));
      const roles = [];
      for (const roleName of mapping.roles.filter((r) => !assignedNames.has(r))) {
        const role = await request('GET', `${base}/clients/${source.id}/roles/${encodeURIComponent(roleName)}`);
        roles.push({ id: role.id, name: role.name });
      }
      if (roles.length > 0) {
        plan.push({ sourceId: source.id, roles });
      }
    }
    return plan;
  }

  async function coreIdentityProviderState(base) {
    const response = await call('GET', `${base}/identity-provider/instances/${CORE_IDP_ALIAS}`);
    if (response.status === 404) {
      return 'missing';
    }
    if (!response.ok) {
      throw new Error(`GET identity provider failed: ${response.status} ${await response.text()}`);
    }
    return (await response.json()).enabled ? 'ok' : 'disabled';
  }

  const desired = createAdspMcpClient(callbackUrls);

  async function processRealm(realm) {
    const base = `/realms/${encodeURIComponent(realm)}`;
    const existing = await findClient(base, ADSP_MCP_CLIENT_ID);
    const plan = planClient(existing, desired);
    const scopePlan = await planScopeMappings(base, existing?.id);
    const scopeCount = scopePlan.reduce((n, p) => n + p.roles.length, 0);
    if (scopeCount > 0) {
      plan.changes.push(`scopeMappings(+${scopeCount})`);
    }
    const action = plan.action === 'match' && scopeCount > 0 ? 'update' : plan.action;
    const idp = await coreIdentityProviderState(base);

    if (apply && action !== 'match') {
      let uuid = existing?.id;
      if (!existing) {
        await request('POST', `${base}/clients`, desired);
        uuid = (await findClient(base, ADSP_MCP_CLIENT_ID)).id;
      } else {
        if (plan.settingsChanged) {
          await request('PUT', `${base}/clients/${uuid}`, {
            ...existing,
            ...desired,
            attributes: { ...existing.attributes, ...desired.attributes },
          });
        }
      }
      for (const { sourceId, roles } of scopePlan) {
        await request('POST', `${base}/clients/${uuid}/scope-mappings/clients/${sourceId}`, roles);
      }
    }

    return { action, changes: plan.changes, idp };
  }

  let realms = options.realms;
  if (realms.length === 0) {
    realms = (await request('GET', '/realms')).map((r) => r.realm);
  }
  realms = realms.filter((realm) => !excluded.has(realm)).sort();

  const counts = { add: 0, update: 0, match: 0 };
  const failures = [];
  const idpProblems = [];

  for (const realm of realms) {
    // Best effort: a problem with one realm is reported and the next realm is still processed.
    try {
      const result = await processRealm(realm);
      counts[result.action]++;
      if (result.idp !== 'ok') {
        idpProblems.push(`${realm} (${result.idp})`);
      }
      const label = { add: 'added', update: 'updated', match: 'already matching' }[result.action];
      const detail = result.changes.length > 0 ? ` [${result.changes.join(', ')}]` : '';
      console.log(`${prefix}${realm}: ${prefix ? `would be ${label}` : label}${detail}`);
    } catch (err) {
      failures.push(realm);
      console.error(`! ${realm}: failed: ${err.message}`);
    }
  }

  console.log(
    `${apply ? 'Applied' : 'Dry run'}: ${realms.length} realms, ${counts.add} added, ${counts.update} updated, ` +
      `${counts.match} already matching, ${failures.length} failed. Skipped: ${[...excluded].join(', ')}.`,
  );
  if (idpProblems.length > 0) {
    console.log(`Realms with a missing or disabled '${CORE_IDP_ALIAS}' identity provider: ${idpProblems.join(', ')}.`);
  }
  if (failures.length > 0) {
    console.error(`${failures.length} realm(s) failed: ${failures.join(', ')}. See the errors above.`);
  }
  if (!apply && counts.add + counts.update > 0) {
    console.log('Re-run with --apply to make these changes.');
  }

  return failures.length > 0 ? 1 : 0;
}

// Only run when executed directly, so planClient can be imported by tests.
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
