# @abgov/adsp-cli

A CLI (`adsp`) and a small Node client library for signing in to ADSP and calling its live APIs. It is published to
npm as `@abgov/adsp-cli`. Developers use the CLI from a terminal. Developer tools use the library, for example
[`@abgov/adsp-sdk-mcp-server`](../adsp-sdk-mcp-server/README.md) for its `list_service_roles` and
`get_service_configuration_schema` tools.

## Install

```bash
npx @abgov/adsp-cli login          # run without installing
npm i -g @abgov/adsp-cli           # or install globally; the command is then `adsp`, e.g. `adsp login`
npm i @abgov/adsp-cli              # use as a library
```

Inside this monorepo, import it with the `@abgov/adsp-cli` path alias (`tsconfig.base.json`).

## How the CLI and library work together

The CLI and the library don't call each other. They share files under `~/.adsp-cli/`:

- **`adsp login`** (run by a person in a terminal) resolves a tenant realm, runs an OAuth2 flow against Keycloak,
  caches the token in `~/.adsp-cli/token-cache.json`, and saves the realm (and environment) as the current context in
  `~/.adsp-cli/config.json`. It is the only command that waits for the user.
- **Library consumers** call `getAccessToken()`. It never blocks or opens a browser: it reads or refreshes the cached
  token, or gets one with client credentials when `ADSP_CLIENT_ID`/`ADSP_CLIENT_SECRET` are set. Consumers then call
  `getServiceUrls()`, `getConfiguration()` and so on themselves.

The interactive login function is not exported. A consumer that gets `'not-authenticated'` from `getAccessToken()`
should tell the user to run `adsp login`.

## Logging in

There are three ways to choose the realm:

```bash
npx @abgov/adsp-cli login --realm my-tenant-realm   # you know the realm
npx @abgov/adsp-cli login --tenant "My Tenant"      # you know the tenant's display name
npx @abgov/adsp-cli login                           # logs in to `core`, lists tenants, and asks you to pick one
```

By default `login` uses the **OOB flow**: it prints an authorization URL (and tries to open a browser), then asks you
to paste the code Keycloak shows. This works in Dev Spaces, containers and other headless environments. On a desktop
where the browser can reach `localhost`, `--local` uses a temporary server on port 3000 to capture the redirect
instead; it times out after 2 minutes.

`login` saves the realm to `~/.adsp-cli/config.json`, so later commands don't need `ADSP_TENANT_REALM`. That
variable still works as an override.

Running `login` again with no flags is cheap: if the saved realm already has a valid cached token, it returns at
once. Any of `--realm`, `--tenant`, `--scope` or `--env` skips this shortcut.

### Selecting an environment

`--env <dev|test|prod>` selects the ADSP environment and saves it, like the realm. `ADSP_ENV` overrides the saved
value. A later login without `--env` keeps the saved environment. If nothing is set, the default is `prod`.

```bash
npx @abgov/adsp-cli login --env dev --tenant "My Tenant"
```

### Requesting additional scopes

`login` always requests the `email` scope. `--scope <name>` (repeatable) requests more, for example the optional
`adsp-cli-admin` client scope used for Keycloak provisioning:

```bash
npx @abgov/adsp-cli login --scope adsp-cli-admin
```

The token cache is scope-aware: a cached token is reused only if it already has every requested scope (it may have
more). Otherwise `login` starts a new browser sign-in.

### Creating a new tenant

With no flags, the tenant picker also offers **+ Create a new tenant** (in every environment, including `prod`) when
your core-realm roles include `beta-tester` or `tenant-service-admin` and you don't already own a tenant
(`tenant-service-admin` users can create more). Names can contain letters, numbers, spaces and underscores (1-50
characters). The CLI creates the tenant, waits for its realm to be ready, then logs in to it. If the name is taken,
it asks for another.

## CI / non-interactive login

`login --ci` uses the client credentials grant instead of a browser. `--tenant` is required. The client ID and
secret come from `--client-id`/`--client-secret` or from `ADSP_CLIENT_ID`/`ADSP_CLIENT_SECRET`:

```bash
export ADSP_CLIENT_ID=adsp-cli-ci
export ADSP_CLIENT_SECRET="$ADSP_CI_SECRET"
npx @abgov/adsp-cli login --ci --tenant "My Tenant"
```

You can also skip `login`. When `ADSP_CLIENT_ID`, `ADSP_CLIENT_SECRET` and a realm (`ADSP_TENANT_REALM`, or one saved
by an earlier login) are all set, `getAccessToken()` (and so `adsp token`, `adsp service-roles`, and so on) gets a
token with client credentials:

```bash
export ADSP_TENANT_REALM=my-tenant-realm
export ADSP_CLIENT_ID=adsp-cli-ci
export ADSP_CLIENT_SECRET="$ADSP_CI_SECRET"
npx @abgov/adsp-cli token
```

### The `adsp-cli-ci` client

Each new tenant realm gets an `adsp-cli-ci` confidential client. It is **disabled by default** and allows only the
client credentials grant. Its service account has `configuration-admin` on configuration-service, plus
`manage-clients` and `manage-users` on `realm-management`. To use it, a tenant admin opens the realm in the Keycloak
admin console, goes to Clients, then `adsp-cli-ci`, turns on _Enabled_, and generates a secret on the Credentials
tab. Store the secret as a CI secret.

## Commands

| Command                                                                                              | Auth                                         | Description                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `login [--realm <realm> \| --tenant <name>] [--scope <name>]... [--env <dev\|test\|prod>] [--local]` | Interactive                                  | Interactive login. See [Logging in](#logging-in).                                                                                                                                                      |
| `login --ci --tenant <name> [--client-id <id>] [--client-secret <secret>] [--env <dev\|test\|prod>]` | Client credentials                           | Non-interactive login. See [CI / non-interactive login](#ci--non-interactive-login).                                                                                                                   |
| `status`                                                                                             | None                                         | Prints the environment and realm and where each came from (env var, saved login or default), the tenant name when known, and the cached token state (`valid`, `expired` or missing). No network calls. |
| `logout`                                                                                             | None                                         | Deletes `~/.adsp-cli/config.json` and `~/.adsp-cli/token-cache.json`.                                                                                                                                  |
| `token`                                                                                              | `getAccessToken()`                           | Prints the access token, refreshed if needed. For example `curl -H "Authorization: Bearer $(adsp token)" ...`.                                                                                         |
| `tenants [name]`                                                                                     | None with `name`; core-realm session without | With a name, looks up that tenant anonymously. Without, lists every tenant using the cached `core` token from a no-flag `login`.                                                                       |
| `service-roles`                                                                                      | `getAccessToken()`                           | Prints every platform service's registered roles as JSON, read from tenant-service configuration.                                                                                                      |
| `directory register --service <name> --url <url>`                                                    | `getAccessToken()`                           | Registers `urn:ads:<tenant>:<service>` in the directory under the current tenant's namespace. Does nothing if the entry exists. Needs the `directory-admin` role.                                      |
| `delete-tenant [name]`                                                                               | Core-realm session, `tenant-service-admin`   | Deletes a tenant and its Keycloak realm. Without a name, asks you to pick a tenant. Asks you to type the tenant name to confirm.                                                                       |
| `help`, `--help`, `-h`                                                                               | None                                         | Prints the command and flag reference.                                                                                                                                                                 |

## Environment variables

| Variable                     | Purpose                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ADSP_TENANT_REALM`          | Overrides the realm saved by `login`.                                                                                         |
| `ADSP_ENV`                   | Overrides the environment saved by `login --env`: `dev`, `test` or `prod` (default `prod`).                                   |
| `ADSP_ACCESS_SERVICE_URL`    | Overrides the access service (Keycloak) URL for the environment.                                                              |
| `ADSP_DIRECTORY_SERVICE_URL` | Overrides the directory service URL for the environment.                                                                      |
| `ADSP_ACCESS_TOKEN`          | If set, `getAccessToken()` returns it as is, without the cache, login or realm lookup.                                        |
| `ADSP_CLIENT_ID`             | Client ID for client credentials: the fallback for `login --ci`, and used by `getAccessToken()` when there's no cached token. |
| `ADSP_CLIENT_SECRET`         | Client secret to go with `ADSP_CLIENT_ID`. Don't log or commit it.                                                            |

## Library usage

```typescript
import { getAccessToken, getDirectoryServiceUrl, getServiceRoles } from '@abgov/adsp-cli';

const result = await getAccessToken();
if (result.status !== 'ok') {
  // Tell the user to run `npx @abgov/adsp-cli login`, or set ADSP_CLIENT_ID and ADSP_CLIENT_SECRET in CI.
  throw new Error('Not authenticated');
}

const roles = await getServiceRoles(result.token, getDirectoryServiceUrl());
```

`getAccessToken()` tries, in order: `ADSP_ACCESS_TOKEN`, a valid cached token, a token refresh, then client
credentials. It never opens a browser. Pass `{ scopes: [...] }` to require extra scopes on the cached token.

## Reference

- **Login** (`login.ts`): `getAccessToken(options?)`, `loginWithClientCredentials(options)` (options `tenant`,
  `clientId`, `clientSecret`, optional `env`) to fill the token cache in a CI script, and `getStatus()` (the data
  behind `adsp status`). Types `AccessTokenResult`, `LoginResult`, `LoginStatus`.
- **Directory** (`directory.ts`): `getDirectoryServiceUrl()`, `getServiceUrls(directoryServiceUrl)` (platform URN to
  URL map), and `registerDirectoryService(directoryServiceUrl, namespace, service, url, accessToken)`, which returns
  `'registered'` or `'exists'`.
- **Configuration** (`configuration.ts`): `getConfiguration(accessToken, configurationServiceUrl, namespace, name)`
  reads the latest revision of a configuration.
- **Platform metadata**: `getServiceRoles(accessToken, directoryServiceUrl)` returns `ServiceRoleEntry[]`, and
  `getServiceConfigurationSchemas(accessToken, directoryServiceUrl, serviceId?)` returns
  `ServiceConfigurationSchema[]`. Both throw `ServiceNotInDirectoryError` if configuration-service isn't in the
  directory.
- **Errors**: `HttpRequestError` (has `status`) for failed HTTP requests.

## Security

`login` uses the `adsp-cli` Keycloak client: public (no secret), PKCE, with consent required. New tenant realms get it
automatically. Its tokens carry only the roles this CLI needs, not all of the user's roles. See
[`apps/tenant-management-api/src/keycloak/configuration.ts`](../../apps/tenant-management-api/src/keycloak/configuration.ts)
for the client configuration.

Older tenant realms, and the `core` realm used by a no-flag `login`, need the client added by hand. See
[docs/core-realm-setup.md](docs/core-realm-setup.md). `--realm` and `--tenant` logins don't use `core`.

## Development

```bash
npx nx test adsp-cli
npx nx lint adsp-cli
npx nx build adsp-cli
```

Releases are published to npm by semantic-release through the `release` target (`libs/adsp-cli/.releaserc.json`,
tags `adsp-cli-v<version>`). Use the commit scope `adsp-cli`, for example `feat(adsp-cli): ...`, so a change triggers
a release.
