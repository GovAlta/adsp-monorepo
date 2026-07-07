# @abgov/adsp-cli

A CLI and client library for authenticating against ADSP and calling its live APIs. Built to be reusable — not tied
to any one consumer's purpose (currently `@abgov/adsp-sdk-mcp-server`'s `list_service_roles` tool; designed
generically enough that other ADSP developer tooling, e.g. the `nx-adsp` Nx plugin's own duplicate login/token-cache
implementation, could adopt it as a distinct follow-up).

## CLI vs. library: division of responsibility

This package is used two different ways by two different processes, coupled only through files on disk — they never
invoke each other directly:

- **The `adsp` binary** (from this package — `npx @abgov/adsp-cli login`, run once by a human in a terminal) does
  exactly one job as far as login goes: resolve a tenant realm (see below), run an interactive browser OAuth2 flow
  against Keycloak for it, cache the resulting token in `~/.adsp-cli/token-cache.json`, and persist the realm itself
  as the current context in `~/.adsp-cli/config.json`. This is the only place an interactive, potentially slow (up
  to 120s) wait happens; its other commands (see below) never block on user interaction.
- **Library consumers** (e.g. an MCP server tool handler, which must never block on user interaction) call
  `getAccessToken()` — a fast, non-interactive function that only reads/refreshes the cache, never opens a browser —
  to get a token, then call `getServiceUrls()`/`getConfiguration()` themselves to actually talk to ADSP.

`loginInteractive` (the browser-opening function) is intentionally **not** part of the public API — only the CLI
entry (`src/main.ts`) calls it. A library consumer that needs a token should always call `getAccessToken()` and
handle its `'not-authenticated'` result by telling the user to run `adsp login`, not by trying to log in itself.

## Logging in: three ways to resolve a realm

```bash
npx @abgov/adsp-cli login --realm my-tenant-realm   # you already know your realm
npx @abgov/adsp-cli login --tenant "My Tenant"      # you know your tenant's display name, not its realm
npx @abgov/adsp-cli login                           # you know neither — logs into `core`, lists every
                                                     # tenant, and prompts you to pick one interactively
```

(`npx @abgov/adsp-cli ...` works without any install step; if you `npm i -g @abgov/adsp-cli` instead, the installed
command is just `adsp` — e.g. `adsp login`, `adsp status`.)

Whichever mode resolves the realm, `login` persists it to `~/.adsp-cli/config.json` — so nothing downstream needs
`ADSP_TENANT_REALM` set at all for the common case. That env var still works as an **override** (e.g. CI, or
switching between multiple tenant contexts without re-running `login`), it's just no longer required.

Running `login` with no args again later is safe and cheap: if the persisted realm already has a valid cached
token, it returns immediately — no core-realm login, no tenant listing, no prompt.

## Requesting additional scopes

`login` always requests the `email` scope; pass `--scope <name>` (repeatable) to additionally request one or more
optional OAuth scopes, e.g. the `adsp-cli-admin` client scope (see Security below) that a consumer like `nx-adsp`
would request for its Keycloak-admin provisioning commands:

```bash
npx @abgov/adsp-cli login --scope adsp-cli-admin
```

`--scope` can be combined with `--realm`/`--tenant`. The token cache is scope-aware: a cached token is only reused
if it already covers everything being requested (a subset check, not exact match — a token cached with *more*
scopes than currently needed still counts). So `login --scope adsp-cli-admin` always gets you a token that actually
has that scope — either by reusing an earlier elevated login, or by triggering a fresh browser round-trip if the
cached token doesn't cover it yet. A later plain `login` (no `--scope`) is unaffected either way, since the base
`email` scope it needs is always covered by any cached token.

## Selecting an environment

`login --env <dev|test|prod>` picks which ADSP environment to talk to and persists it to
`~/.adsp-cli/config.json`, mirroring how the realm is persisted — so `ADSP_ENV` is an optional **override** (e.g.
CI, or a one-off run) rather than something you need to set every session:

```bash
npx @abgov/adsp-cli login --env dev --tenant "My Tenant"
```

Any of `--realm`/`--tenant`/`--scope`/`--env` skips the no-args "reuse a cached token" short-circuit, so an explicit
environment request always resolves rather than silently returning whatever happens to be cached. Omitting `--env`
on a later login preserves whatever environment was persisted by an earlier one — it's never reset to the default
just because a login didn't mention it. `adsp-cli status` reports the currently-resolved environment and where it
came from (`ADSP_ENV`, persisted login, or the `prod` default).

## Security

`login` authenticates against a public, secret-less Keycloak client (PKCE-only, consent required on every login),
provisioned automatically for new tenant realms. The resulting token is scoped to the minimum roles this CLI
actually needs, not a user's full role set — so a cached token sitting in `~/.adsp-cli/token-cache.json` can't be
used for anything beyond what this tool itself does, even if that file were somehow exposed. See
[`apps/tenant-management-api/src/keycloak/configuration.ts`](https://github.com/GovAlta/adsp-monorepo/blob/main/apps/tenant-management-api/src/keycloak/configuration.ts)
in the [adsp-monorepo](https://github.com/GovAlta/adsp-monorepo) repo for the exact client configuration.

Tenants created before this client existed, and the Keycloak `core` realm used by the no-args `login` mode, need
an equivalent client added by hand — see
[`docs/core-realm-setup.md`](https://github.com/GovAlta/adsp-monorepo/blob/main/libs/adsp-cli/docs/core-realm-setup.md)
for the one-time manual setup steps. `--realm`/`--tenant` logins are unaffected either way — they never touch `core`.

## Commands

| Command | Auth required | Description |
|---|---|---|
| `login [--realm <realm> \| --tenant <name>] [--scope <name>]... [--env <dev\|test\|prod>]` | Interactive (opens a browser) | See above. |
| `status` | No | Prints the current environment and realm (and where each came from — `ADSP_ENV`/`ADSP_TENANT_REALM`, persisted login, or default) and the cached token's state (`valid` / `expired` / `missing`). Read-only — no network calls. |
| `logout` | No | Clears `~/.adsp-cli/config.json` and `~/.adsp-cli/token-cache.json`. Safe to run when already logged out. |
| `token` | Yes (`getAccessToken()`) | Prints the raw access token to stdout — refreshed first if expired, same as any other command. Handy for scripting, e.g. `curl -H "Authorization: Bearer $(adsp token)" ...`. |
| `tenants [name]` | No (with `name`) / core-realm session (without) | With a name: anonymous exact-name lookup, no login needed. Without: lists every tenant — requires a cached core-realm token (established by a prior no-args `login`); this command never triggers an interactive login itself. |
| `service-roles` | Yes (`getAccessToken()`) | Prints the same data as `@abgov/adsp-sdk-mcp-server`'s `list_service_roles` tool — every platform service's registered RBAC role, read live from tenant-service configuration. |
| `help`, `--help`, `-h` | No | Prints a full command/flag reference and exits 0 (distinct from the "Unknown command" error path, which exits 1). |

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ADSP_TENANT_REALM` | No | Override for the realm resolved by the last `login` (persisted config). Required only if you've never run `login` and don't want to. |
| `ADSP_ENV` | No (default `prod`) | Override for the environment resolved by the last `login --env` (persisted config) — `dev` \| `test` \| `prod`, selects preset `accessServiceUrl`/`directoryServiceUrl`. Required only if you've never run `login --env` and don't want to. |
| `ADSP_ACCESS_SERVICE_URL` | No | Overrides the preset access-service (Keycloak) URL for the selected environment. |
| `ADSP_DIRECTORY_SERVICE_URL` | No | Overrides the preset directory-service URL for the selected environment. |
| `ADSP_ACCESS_TOKEN` | No | Escape hatch — if set, `getAccessToken()` returns it directly, skipping cache/login/realm-resolution entirely. Useful for CI-like or pre-authenticated use. |

## Library usage

```typescript
import { getAccessToken, getDirectoryServiceUrl, getServiceUrls, getConfiguration, getServiceRoles } from '@abgov/adsp-cli';

const result = await getAccessToken();
if (result.status !== 'ok') {
  // 'not-authenticated' — tell the user to run `npx @abgov/adsp-cli login`
  throw new Error('Not authenticated');
}

const directoryServiceUrl = getDirectoryServiceUrl();
const serviceUrls = await getServiceUrls(directoryServiceUrl);

// Or, for the common "which roles can I assign" case directly:
const roles = await getServiceRoles(result.token, directoryServiceUrl);
```
