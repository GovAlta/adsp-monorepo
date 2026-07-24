#!/usr/bin/env node
import { getDirectoryServiceUrl } from './directory';
import { EnvironmentName, resolveEnvironmentUrls } from './environments';
import { CORE_REALM, getAccessToken, getCachedOrRefreshedToken, getStatus, loginInteractive, logout } from './login';
import { getServiceRoles } from './serviceRoles';
import { findTenantByName, listTenants } from './tenants';

const USAGE =
  'Usage: adsp <login [--realm <realm> | --tenant <name>] [--scope <name>]... [--env <dev|test|prod>] | status | logout | token | tenants [name] | service-roles>';

const HELP_TEXT = `adsp-cli — CLI and client library for authenticating against ADSP and calling its live APIs.

${USAGE}

Commands:
  login [--realm <realm> | --tenant <name>] [--scope <name>]... [--env <dev|test|prod>]
                          Log in interactively (opens a browser). Resolves a tenant realm via
                          --realm (direct), --tenant (anonymous name lookup), or neither (logs
                          into core, then prompts you to pick a tenant — in dev/test, this
                          prompt also offers to create a new tenant). Persists the resolved
                          realm/environment so later commands don't need them set again.
  status                  Print the current environment, realm, and cached token state. Read-only.
  logout                  Clear the persisted realm/environment and every cached token.
  token                   Print the current access token to stdout (refreshed if expired).
  tenants [name]          Look up a tenant by name (anonymous), or list every tenant (requires
                          a cached core-realm session from a prior no-args login).
  service-roles           Print every platform service's registered RBAC role, read live from
                          tenant-service configuration.
  help, --help, -h        Show this help.

Flags (login only):
  --realm <realm>         Log in to a specific realm directly.
  --tenant <name>         Resolve a realm from a tenant's display name (anonymous lookup).
  --scope <name>          Request an additional OAuth scope beyond the default 'email'.
                          Repeatable, e.g. --scope adsp-cli-admin.
  --env <dev|test|prod>   Select which ADSP environment to log in to. Defaults to whatever
                          was last persisted, or 'prod' if nothing has ever been set.

Environment variables (all optional overrides — see README for details):
  ADSP_TENANT_REALM, ADSP_ENV, ADSP_ACCESS_SERVICE_URL, ADSP_DIRECTORY_SERVICE_URL, ADSP_ACCESS_TOKEN`;

export function parseLoginArgs(argv: string[]): {
  realm?: string;
  tenant?: string;
  scopes?: string[];
  env?: EnvironmentName;
} {
  const options: { realm?: string; tenant?: string; scopes?: string[]; env?: EnvironmentName } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--realm' && argv[i + 1]) {
      options.realm = argv[++i];
    } else if (argv[i] === '--tenant' && argv[i + 1]) {
      options.tenant = argv[++i];
    } else if (argv[i] === '--scope' && argv[i + 1]) {
      (options.scopes ??= []).push(argv[++i]);
    } else if (argv[i] === '--env' && argv[i + 1]) {
      const value = argv[++i];
      if (value !== 'dev' && value !== 'test' && value !== 'prod') {
        throw new Error(`Invalid --env value '${value}'. Must be one of: dev, test, prod.`);
      }
      options.env = value;
    }
  }
  return options;
}

async function runLogin(argv: string[]): Promise<void> {
  const result = await loginInteractive(parseLoginArgs(argv));
  // eslint-disable-next-line no-console
  console.log(result.reused ? `Already logged in as realm '${result.realm}'.` : `Logged in as realm '${result.realm}'.`);
}

function runStatus(): void {
  const status = getStatus();

  const envSourceLabel =
    status.envSource === 'env' ? 'ADSP_ENV' : status.envSource === 'config' ? 'persisted login' : 'default';
  // eslint-disable-next-line no-console
  console.log(`Environment: ${status.env} (from ${envSourceLabel})`);

  if (!status.authenticated && !status.realm) {
    // eslint-disable-next-line no-console
    console.log('Not logged in. Run `adsp login`.');
    return;
  }

  const sourceLabel = status.realmSource === 'env' ? 'ADSP_TENANT_REALM' : 'persisted login';
  const tokenLabel =
    status.tokenState === 'valid'
      ? 'valid'
      : status.tokenState === 'expired'
      ? 'expired (will refresh automatically on next use)'
      : 'no cached token — run `adsp login`';

  // eslint-disable-next-line no-console
  console.log(`Realm: ${status.realm}${status.tenantName ? ` (${status.tenantName})` : ''} (from ${sourceLabel})`);
  // eslint-disable-next-line no-console
  console.log(`Token: ${tokenLabel}`);
}

function runLogout(): void {
  logout();
  // eslint-disable-next-line no-console
  console.log('Logged out.');
}

async function runTenants(name: string | undefined): Promise<void> {
  const { directoryServiceUrl, accessServiceUrl } = resolveEnvironmentUrls();

  if (name) {
    const tenant = await findTenantByName(directoryServiceUrl, name);
    // eslint-disable-next-line no-console
    console.log(tenant ? JSON.stringify(tenant, null, 2) : `Tenant '${name}' not found.`);
    return;
  }

  const coreToken = await getCachedOrRefreshedToken(accessServiceUrl, CORE_REALM);
  if (!coreToken) {
    throw new Error(
      "No core-realm session. Run 'adsp login' (no args) to establish one, or use 'adsp tenants <name>' " +
        'to look up a specific tenant without logging in.'
    );
  }

  const tenants = await listTenants(directoryServiceUrl, coreToken);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(tenants, null, 2));
}

async function runToken(): Promise<void> {
  const tokenResult = await getAccessToken();
  if (tokenResult.status === 'not-authenticated') {
    throw new Error('Not authenticated. Run `adsp login` in a terminal, then retry.');
  }

  // eslint-disable-next-line no-console
  console.log(tokenResult.token);
}

async function runServiceRoles(): Promise<void> {
  const tokenResult = await getAccessToken();
  if (tokenResult.status === 'not-authenticated') {
    throw new Error('Not authenticated. Run `adsp login` in a terminal, then retry.');
  }

  const roles = await getServiceRoles(tokenResult.token, getDirectoryServiceUrl());
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(roles, null, 2));
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  try {
    switch (command) {
      case 'help':
      case '--help':
      case '-h':
        // eslint-disable-next-line no-console
        console.log(HELP_TEXT);
        break;
      case 'login':
        await runLogin(rest);
        break;
      case 'status':
        runStatus();
        break;
      case 'logout':
        runLogout();
        break;
      case 'token':
        await runToken();
        break;
      case 'tenants':
        await runTenants(rest[0]);
        break;
      case 'service-roles':
        await runServiceRoles();
        break;
      default:
        // eslint-disable-next-line no-console
        console.error(`Unknown command: ${command ?? '(none)'}. ${USAGE}`);
        process.exitCode = 1;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error((err as Error)?.message ?? err);
    process.exitCode = 1;
  }
}

// Guarded so this module can be imported (e.g. to unit-test parseLoginArgs) without triggering the CLI itself.
if (require.main === module) {
  main();
}
