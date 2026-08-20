#!/usr/bin/env node
import { getDirectoryServiceUrl, registerDirectoryService } from './directory';
import { EnvironmentName, resolveEnvironmentUrls } from './environments';
import { CORE_REALM, getAccessToken, getCachedOrRefreshedToken, getStatus, isTenantServiceAdmin, loginInteractive, loginWithClientCredentials, logout } from './login';
import { getServiceRoles } from './serviceRoles';
import { deleteTenantById, findTenantByName, listTenants, Tenant } from './tenants';

const USAGE =
  'Usage: adsp <login [--realm <realm> | --tenant <name>] [--scope <name>]... [--env <dev|test|prod>] | ' +
  'login --ci --tenant <name> [--client-id <id>] [--client-secret <secret>] [--env <dev|test|prod>] | ' +
  'status | logout | token | tenants [name] | service-roles | delete-tenant <name> | ' +
  'directory register --service <name> --url <url> [--namespace <ns>]>';

const HELP_TEXT = `adsp-cli — CLI and client library for authenticating against ADSP and calling its live APIs.

${USAGE}

Commands:
  login [--realm <realm> | --tenant <name>] [--scope <name>]... [--env <dev|test|prod>]
                          Log in interactively (opens a browser). Resolves a tenant realm via
                          --realm (direct), --tenant (anonymous name lookup), or neither (logs
                          into core, then prompts you to pick a tenant — in dev/test, this
                          prompt also offers to create a new tenant). Persists the resolved
                          realm/environment so later commands don't need them set again.
  login --ci --tenant <name> [--client-id <id>] [--client-secret <secret>] [--env <dev|test|prod>]
                          Log in non-interactively via the client credentials grant. Intended for
                          CI environments. --tenant is required. --client-id and --client-secret
                          can be supplied as flags or via the ADSP_CLIENT_ID / ADSP_CLIENT_SECRET
                          environment variables. The tenant's 'adsp-cli-ci' confidential client is
                          bootstrapped disabled at tenant creation — a tenant admin must enable it
                          and generate credentials via the Keycloak admin console before use.
  status                  Print the current environment, realm, and cached token state. Read-only.
  logout                  Clear the persisted realm/environment and every cached token.
  token                   Print the current access token to stdout (refreshed if expired).
  tenants [name]          Look up a tenant by name (anonymous), or list every tenant (requires
                          a cached core-realm session from a prior no-args login).
  service-roles           Print every platform service's registered RBAC role, read live from
                          tenant-service configuration.
  delete-tenant <name>    Permanently delete a tenant and its Keycloak realm. Requires a cached
                          core-realm session with the tenant-service-admin role. Prompts for
                          confirmation before deleting.
  directory register --service <name> --url <url> [--namespace <ns>]
                          Register a service entry in the ADSP directory under the tenant's
                          namespace. Skips silently if the entry already exists (register-once
                          semantics — no overwrite). --namespace defaults to the kebab-case of
                          the tenant name from the current login session. Requires the
                          'directory-admin' role (tenant admins have it automatically).
  help, --help, -h        Show this help.

Flags (login only):
  --realm <realm>         Log in to a specific realm directly (interactive).
  --tenant <name>         Resolve a realm from a tenant's display name (anonymous lookup).
  --scope <name>          Request an additional OAuth scope beyond the default 'email'.
                          Repeatable, e.g. --scope adsp-cli-admin. Interactive only.
  --env <dev|test|prod>   Select which ADSP environment to log in to. Defaults to whatever
                          was last persisted, or 'prod' if nothing has ever been set.
  --ci                    Use client credentials grant instead of the browser flow.
  --client-id <id>        Client ID for --ci login (or set ADSP_CLIENT_ID).
  --client-secret <secret>  Client secret for --ci login (or set ADSP_CLIENT_SECRET).

Environment variables (all optional overrides — see README for details):
  ADSP_TENANT_REALM, ADSP_ENV, ADSP_ACCESS_SERVICE_URL, ADSP_DIRECTORY_SERVICE_URL,
  ADSP_ACCESS_TOKEN, ADSP_CLIENT_ID, ADSP_CLIENT_SECRET`;

export function parseLoginArgs(argv: string[]): {
  realm?: string;
  tenant?: string;
  scopes?: string[];
  env?: EnvironmentName;
  ci?: boolean;
  clientId?: string;
  clientSecret?: string;
} {
  const options: {
    realm?: string;
    tenant?: string;
    scopes?: string[];
    env?: EnvironmentName;
    ci?: boolean;
    clientId?: string;
    clientSecret?: string;
  } = {};
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
    } else if (argv[i] === '--ci') {
      options.ci = true;
    } else if (argv[i] === '--client-id' && argv[i + 1]) {
      options.clientId = argv[++i];
    } else if (argv[i] === '--client-secret' && argv[i + 1]) {
      options.clientSecret = argv[++i];
    }
  }
  return options;
}

async function runLogin(argv: string[]): Promise<void> {
  const options = parseLoginArgs(argv);

  if (options.ci) {
    if (!options.tenant) {
      throw new Error('--ci requires --tenant <name>.');
    }
    const clientId = options.clientId ?? process.env.ADSP_CLIENT_ID;
    const clientSecret = options.clientSecret ?? process.env.ADSP_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error(
        '--ci requires a client ID and secret. Pass --client-id and --client-secret, or set ADSP_CLIENT_ID and ADSP_CLIENT_SECRET.',
      );
    }
    const result = await loginWithClientCredentials({ tenant: options.tenant, clientId, clientSecret, env: options.env });
    // eslint-disable-next-line no-console
    console.log(`Logged in as realm '${result.realm}' using client credentials.`);
    return;
  }

  const result = await loginInteractive(options);
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

async function pickTenantInteractive(directoryServiceUrl: string, coreToken: string): Promise<Tenant> {
  const tenants = await listTenants(directoryServiceUrl, coreToken);
  if (tenants.length === 0) {
    throw new Error('No tenants found.');
  }

  const { prompt } = await import('enquirer');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { name } = await (prompt as any)({
    type: 'autocomplete',
    name: 'name',
    message: 'Which tenant?',
    hint: '(type to filter)',
    limit: 10,
    choices: tenants.map((t) => t.name),
  });

  const picked = tenants.find((t) => t.name === name);
  if (!picked) {
    throw new Error(`Tenant '${name}' not found.`);
  }
  return picked;
}

async function runDeleteTenant(argv: string[]): Promise<void> {
  const { accessServiceUrl, directoryServiceUrl } = resolveEnvironmentUrls();

  const coreToken = await getCachedOrRefreshedToken(accessServiceUrl, CORE_REALM);
  if (!coreToken) {
    throw new Error("No core-realm session. Run 'adsp login' (no args) to establish a core-realm session first.");
  }

  if (!isTenantServiceAdmin(coreToken)) {
    throw new Error("Your account doesn't have the 'tenant-service-admin' role required to delete tenants.");
  }

  const tenant = argv[0]
    ? await (async () => {
        const found = await findTenantByName(directoryServiceUrl, argv[0]);
        if (!found) throw new Error(`Tenant '${argv[0]}' not found.`);
        return found;
      })()
    : await pickTenantInteractive(directoryServiceUrl, coreToken);

  // eslint-disable-next-line no-console
  console.log(`\nTenant:  ${tenant.name}`);
  // eslint-disable-next-line no-console
  console.log(`Realm:   ${tenant.realm}`);
  // eslint-disable-next-line no-console
  console.log(`Admin:   ${tenant.adminEmail ?? '(unknown)'}`);
  // eslint-disable-next-line no-console
  console.log('\nThis will permanently delete the tenant and its Keycloak realm. This cannot be undone.\n');

  const { prompt } = await import('enquirer');
  const { confirmation } = await prompt<{ confirmation: string }>({
    type: 'input',
    name: 'confirmation',
    message: 'Type the tenant name to confirm deletion:',
  });

  if (confirmation !== tenant.name) {
    throw new Error('Deletion cancelled — confirmation did not match the tenant name.');
  }

  const id = tenant.id ?? '';
  const rawId = id.substring(id.lastIndexOf('/') + 1);
  if (!rawId) {
    throw new Error(`Could not determine the ID for tenant '${tenant.name}'.`);
  }

  const result = await deleteTenantById(directoryServiceUrl, coreToken, rawId);
  // eslint-disable-next-line no-console
  console.log(
    result.success
      ? `Tenant '${tenant.name}' deleted successfully.`
      : `Tenant '${tenant.name}' was partially deleted (realm removed: ${result.deletedRealm}, record removed: ${result.deletedTenant}).`
  );
}

export function parseDirectoryRegisterArgs(argv: string[]): { service?: string; url?: string; namespace?: string } {
  const options: { service?: string; url?: string; namespace?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--service' && argv[i + 1]) {
      options.service = argv[++i];
    } else if (argv[i] === '--url' && argv[i + 1]) {
      options.url = argv[++i];
    } else if (argv[i] === '--namespace' && argv[i + 1]) {
      options.namespace = argv[++i];
    }
  }
  return options;
}

async function runDirectoryRegister(argv: string[]): Promise<void> {
  const options = parseDirectoryRegisterArgs(argv);

  if (!options.service) {
    throw new Error('--service <name> is required.');
  }
  if (!options.url) {
    throw new Error('--url <url> is required.');
  }

  let namespace = options.namespace;
  if (!namespace) {
    const status = getStatus();
    if (!status.tenantName) {
      throw new Error(
        'Could not determine the directory namespace — no tenant found in the current login session. ' +
          'Pass --namespace explicitly or run `adsp login --tenant <name>` first.',
      );
    }
    namespace = status.tenantName.toLowerCase().replace(/ /g, '-');
  }

  const tokenResult = await getAccessToken();
  if (tokenResult.status === 'not-authenticated') {
    throw new Error('Not authenticated. Run `adsp login` in a terminal, then retry.');
  }

  const directoryServiceUrl = getDirectoryServiceUrl();
  const result = await registerDirectoryService(directoryServiceUrl, namespace, options.service, options.url, tokenResult.token);

  if (result === 'exists') {
    // eslint-disable-next-line no-console
    console.log(`Directory entry urn:ads:${namespace}:${options.service} already exists, skipping.`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Registered urn:ads:${namespace}:${options.service} → ${options.url}`);
  }
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
      case 'delete-tenant':
        await runDeleteTenant(rest);
        break;
      case 'directory': {
        const [subcommand, ...subrest] = rest;
        if (subcommand === 'register') {
          await runDirectoryRegister(subrest);
        } else {
          // eslint-disable-next-line no-console
          console.error(`Unknown directory subcommand: ${subcommand ?? '(none)'}. Try: adsp directory register --service <name> --url <url>`);
          process.exitCode = 1;
        }
        break;
      }
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
