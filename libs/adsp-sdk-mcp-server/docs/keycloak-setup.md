# Keycloak setup for the hosted ADSP SDK MCP server

The hosted server (`MCP_TRANSPORT=http`) needs three Keycloak clients in each environment:

| Realm             | Client                             | Signed in by                                                             | Set up by                                                                                       |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `core`            | `urn:ads:platform:adsp-mcp`        | The developer's MCP client (Claude Code, VS Code, Cursor, MCP Inspector) | This runbook                                                                                    |
| `core`            | `urn:ads:platform:adsp-mcp-server` | The hosted server, to call tenant-service                                | This runbook                                                                                    |
| Each tenant realm | `adsp-mcp`                         | The hosted server only                                                   | tenant-management-api at tenant creation; [backfill script](#tenant-realms) for existing realms |

`core` isn't provisioned by this repo's code, so a platform administrator adds its two clients in the Keycloak
admin console, as for [`adsp-cli`](../../adsp-cli/docs/core-realm-setup.md). Do it once per environment, before
deploying a server that signs in to `core`.

In the tables below, `<MCP_PUBLIC_URL>` is the server's `MCP_PUBLIC_URL` in that environment, without a trailing
slash.

## Core-realm `urn:ads:platform:adsp-mcp`

The developer's MCP client signs in here. The token it gets is accepted only by the hosted server: it is not
valid at tenant-service or any other ADSP service.

| Setting                                                 | Value                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client ID                                               | `urn:ads:platform:adsp-mcp`                                                                                                                       |
| Client type                                             | OpenID Connect, public (no secret)                                                                                                                |
| Standard flow (authorization code)                      | On                                                                                                                                                |
| Direct access grants / implicit flow / service accounts | Off                                                                                                                                               |
| Consent required                                        | On                                                                                                                                                |
| PKCE code challenge method                              | S256                                                                                                                                              |
| Full scope allowed                                      | Off, with no roles added                                                                                                                          |
| Valid redirect URIs                                     | Exact, no wildcards, one line each: see [Loopback redirect URIs](#loopback-redirect-uris)                                                         |
| Web origins                                             | `https://vscode.dev` and `http://localhost:6274` (browser-hosted clients exchange the code from the page)                                         |
| Client scopes → dedicated mapper                        | **Audience** mapper `adsp-sdk-mcp-server-aud`: included custom audience = `<MCP_PUBLIC_URL>/mcp`, add to access token = on, add to ID token = off |

Don't add `urn:ads:platform:tenant-service` (or any other service) to this client's audience. The server calls
tenant-service with its own sign-in, through `urn:ads:platform:adsp-mcp-server`.

### Loopback redirect URIs

| MCP client    | Redirect URIs                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Claude Code   | `http://localhost:33419/callback`, `http://127.0.0.1:33419/callback`                                                         |
| VS Code       | `http://127.0.0.1:33418`, `http://127.0.0.1:33418/`, `https://vscode.dev/redirect`                                           |
| Cursor        | `http://localhost:8787/callback`, `cursor://anysphere.cursor-mcp/oauth/callback`                                             |
| MCP Inspector | `http://localhost:6274/oauth/callback`, `http://localhost:6274/oauth/callback/debug`, `http://127.0.0.1:6276/oauth/callback` |

## Core-realm `urn:ads:platform:adsp-mcp-server`

The hosted server signs the developer in here to call tenant-service (`list_my_tenants`). Only the server's
callback can receive its codes, so no local process can get its tokens. It must be a separate client from the core
`urn:ads:platform:adsp-mcp`, which keeps loopback redirect URIs.

| Setting                                                 | Value                                                                                                                                                                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client ID                                               | `urn:ads:platform:adsp-mcp-server`                                                                                                                                                                                   |
| Client type                                             | OpenID Connect, public (no secret)                                                                                                                                                                                   |
| Standard flow (authorization code)                      | On                                                                                                                                                                                                                   |
| Direct access grants / implicit flow / service accounts | Off                                                                                                                                                                                                                  |
| Consent required                                        | On                                                                                                                                                                                                                   |
| PKCE code challenge method                              | S256                                                                                                                                                                                                                 |
| Valid redirect URIs                                     | The server callbacks, exact. Production: only `<MCP_PUBLIC_URL>/oauth/callback`. Dev and UAT: that URL and `http://localhost:<port>/oauth/callback`. Same list as tenant-management-api's `MCP_SERVER_CALLBACK_URLS` |
| Web origins                                             | None                                                                                                                                                                                                                 |
| Client scopes                                           | `email` assigned as a **Default** scope, so tokens carry the `email` claim                                                                                                                                           |
| Full scope allowed                                      | Off                                                                                                                                                                                                                  |
| Client scopes → dedicated → Scope                       | Assign the realm roles `beta-tester` and `tenant-service-admin` (needed for a future `create_tenant`)                                                                                                                |
| Client scopes → dedicated mapper                        | **Audience** mapper `tenant-service-aud`: included client audience = `urn:ads:platform:tenant-service`, add to access token = on, add to ID token = off                                                              |

tenant-management-api checks `aud` before any role check (see the [`adsp-cli` runbook](../../adsp-cli/docs/core-realm-setup.md#why-the-audience-mapper-specifically-matters)),
so without the audience mapper every call fails with 401.

## Adding the core-realm clients in production

A platform administrator adds both clients by hand in the production Keycloak admin console, before the hosted
server is deployed to production. Use the production `MCP_PUBLIC_URL` for `<MCP_PUBLIC_URL>`. Sign in to the admin
console and select the `core` realm.

### Add `urn:ads:platform:adsp-mcp`

1. **Clients → Create client**. Client type **OpenID Connect**, client ID `urn:ads:platform:adsp-mcp`. **Next**.
2. Client authentication **Off**, authorization **Off**. Under authentication flow, tick only **Standard flow**:
   untick direct access grants, implicit flow, service accounts and the device and CIBA grants. **Next**.
3. Valid redirect URIs: each URI in [Loopback redirect URIs] and add the production lookback urls(#loopback-redirect-uris), one per line. Web origins:
   `https://vscode.dev` and `http://localhost:6274`. **Save**.
4. **Settings → Login settings**: consent required **On**. **Save**.
5. **Advanced → Advanced settings**: Proof Key for Code Exchange code challenge method **S256**. **Save**.
6. **Client scopes → `urn:ads:platform:adsp-mcp-dedicated` → Scope**: full scope allowed **Off**. Don't assign
   any roles.
7. **Save**

### Add `urn:ads:platform:adsp-mcp-server`

1. **Clients → Create client**. Client type **OpenID Connect**, client ID `urn:ads:platform:adsp-mcp-server`.
   **Next**.
2. Client authentication **Off**, authorization **Off**. Under authentication flow, tick only **Standard flow**.
   **Next**.
3. Valid redirect URIs: only `<MCP_PUBLIC_URL>/oauth/callback`. Don't add a `localhost` URI in production. Web
   origins: leave empty. **Save**.
4. **Settings → Login settings**: consent required **On**. **Save**.
5. **Advanced → Advanced settings**: Proof Key for Code Exchange code challenge method **S256**. **Save**.
6. **Client scopes**: check that `email` is listed with assigned type **Default**. If it isn't, **Add client scope
   → `email` → Add → Default**.
7. **Save**

Then check both clients as below.

## Checking the core-realm clients

For each client, open **Clients → `<client>` → Client scopes → Evaluate**, pick a user who has `beta-tester`, and
open **Generated access token**:

- `urn:ads:platform:adsp-mcp`: `aud` is `<MCP_PUBLIC_URL>/mcp` and doesn't contain `urn:ads:platform:tenant-service`.
- `urn:ads:platform:adsp-mcp-server`: `aud` contains `urn:ads:platform:tenant-service`, `email` is present, and
  `realm_access.roles` contains only roles from its scope.

In production, also check that `urn:ads:platform:adsp-mcp-server`'s only redirect URI is
`<MCP_PUBLIC_URL>/oauth/callback`.

## Tenant realms

New tenant realms get `adsp-mcp` from `createAdspMcpPublicClientConfig` in
`apps/tenant-management-api/src/keycloak/configuration.ts`, with redirect URIs from tenant-management-api's
`MCP_SERVER_CALLBACK_URLS`. Set that variable in each environment before deploying it:

- Production: `<MCP_PUBLIC_URL>/oauth/callback` only.
- Dev and UAT: `<MCP_PUBLIC_URL>/oauth/callback,http://localhost:<port>/oauth/callback`.

Each URL must be exact, with no wildcards, and https (plain http only on `localhost`). tenant-management-api
refuses to start otherwise. Deployed images set `NODE_ENV=production`, so there an unset variable leaves the client
with no redirect URIs and nobody can sign in through it. Run locally, it defaults to
`http://localhost:3000/oauth/callback`.

| Setting                                                 | Value                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client ID                                               | `adsp-mcp`                                                                                                                                                                                                                                                                                    |
| Client type                                             | OpenID Connect, public (no secret)                                                                                                                                                                                                                                                            |
| Standard flow (authorization code)                      | On                                                                                                                                                                                                                                                                                            |
| Direct access grants / implicit flow / service accounts | Off                                                                                                                                                                                                                                                                                           |
| Consent required                                        | On                                                                                                                                                                                                                                                                                            |
| PKCE code challenge method                              | S256                                                                                                                                                                                                                                                                                          |
| Full scope allowed                                      | Off                                                                                                                                                                                                                                                                                           |
| Client scopes → dedicated → Scope                       | The client role `configuration-admin` of `urn:ads:platform:configuration-service`                                                                                                                                                                                                             |
| Valid redirect URIs                                     | `MCP_SERVER_CALLBACK_URLS`. No loopback URIs: they would let any local process get the same token                                                                                                                                                                                             |
| Web origins                                             | None                                                                                                                                                                                                                                                                                          |
| Client scopes → dedicated mappers                       | **Audience** mapper `adsp-sdk-mcp-server-aud`: included custom audience = `urn:ads:platform:adsp-sdk-mcp-server`. **Audience** mapper `configuration-service-aud`: included client audience = `urn:ads:platform:configuration-service`. Both: add to access token = on, add to ID token = off |

### Backfilling existing tenant realms

Existing realms are brought to the same configuration by `tools/keycloak/backfill-adsp-mcp-client.mjs`. In each
realm it adds `adsp-mcp` where it's missing, and otherwise corrects the settings, redirect URIs, web origins and
audience mappers that differ and adds missing scope mappings. It only adds mappers and scope mappings; it never
removes extra ones. A realm that already matches is left untouched, so it's safe to re-run.

Run it with a master-realm client that has `view-realm`, `view-clients` and `manage-clients` on every tenant
realm. A tenant administrator can't run it, and neither can `tenant-realm-admin`, whose roles are trimmed. Pass the
same callback list as `MCP_SERVER_CALLBACK_URLS`. `master` and `core` are always skipped; `--exclude <a,b>` skips
more, and `--realms <a,b>` processes only the realms listed. Run with `--help` for all options.

1. Dry run, and review what would change. The secret is read from `KEYCLOAK_ADMIN_CLIENT_SECRET` (in PowerShell,
   `$env:KEYCLOAK_ADMIN_CLIENT_SECRET = '...'`), which keeps it out of shell history and the process list;
   `--client-secret` also works.

   ```sh
   export KEYCLOAK_ADMIN_CLIENT_SECRET=...
   node tools/keycloak/backfill-adsp-mcp-client.mjs --url <keycloak root url> --client-id <admin client> \
     --callback-urls <MCP_SERVER_CALLBACK_URLS>
   ```

   `--url` is the Keycloak root URL without `/auth`. Each realm is reported as would be added, would be updated
   (with what differs, for example `[redirectUris, webOrigins, description]` for a realm that still has the
   CS-5617 loopback URIs), or already matching. Realms whose `core` identity provider is missing or disabled are
   listed at the end; the script doesn't change them, so raise a follow-up for each. Realms that aren't tenant
   realms show up in that list too: skip them with `--exclude`.

2. Try one realm with `--realms <realm> --apply`, then sign in to it through the hosted server and check the
   token as in [Checking a tenant realm](#checking-a-tenant-realm).
3. Apply to every realm with `--apply`. A failed realm is reported with its reason and the others still run; the
   exit status is 1 if any failed. Fix the cause and re-run: realms already done are reported as already matching.
4. Run the dry run again. Every realm should be reported as already matching.

To reach Keycloak without the router, port-forward and use `--url http://localhost:8080`:
`oc port-forward svc/access-service 8080:8080 -n adsp-<env>`.

### Checking a tenant realm

Open **Clients → `adsp-mcp` → Client scopes → Evaluate**, pick a user who has `configuration-admin`, and open
**Generated access token**: `aud` contains `urn:ads:platform:adsp-sdk-mcp-server` and
`urn:ads:platform:configuration-service`, and `resource_access` contains only `configuration-admin` under
`urn:ads:platform:configuration-service`. Also check that **Valid redirect URIs** is exactly
`MCP_SERVER_CALLBACK_URLS` and **Web origins** is empty.

### Later changes

Later changes to the tenant-realm `adsp-mcp` client go through the same script:

1. Change `createAdspMcpPublicClientConfig` in `apps/tenant-management-api/src/keycloak/configuration.ts`, and
   the scope mappings granted to `adsp-mcp` in `keycloak.ts` if they change.
2. Make the same change to `createAdspMcpClient` and `SCOPE_MAPPINGS` in the script.
   `adsp-mcp-backfill.spec.ts` fails until the client definitions match; it doesn't compare scope mappings, so
   check those by hand.
3. Run the script in each environment as above.
