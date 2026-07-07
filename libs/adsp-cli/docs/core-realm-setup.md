# Manual setup: the Keycloak `core` realm's `adsp-cli` client

This is a one-time, platform-admin task — not something a CLI user needs to do themselves. It only affects
`adsp-cli login` with no arguments (the "figure out my tenant for me" mode, which logs into `core` first to list
every tenant before prompting). `--realm`/`--tenant` logins never touch `core` and are unaffected by this gap.

## Why this exists

Tenant realms get an `adsp-cli` client automatically — see
[`createAdspCliPublicClientConfig`](../../../apps/tenant-management-api/src/keycloak/configuration.ts) in
`apps/tenant-management-api/src/keycloak/configuration.ts`, wired into tenant-realm creation in `keycloak.ts`.
`core` is pre-existing infrastructure not provisioned by this repo's code at all, so it needs the equivalent client
added directly in the Keycloak console.

## Required client configuration

| Setting | Value |
|---|---|
| Client ID | `adsp-cli` |
| Client type | OpenID Connect, public (no secret) |
| Standard flow (authorization code) | On |
| Direct access grants / implicit flow / service accounts | Off |
| Consent required | On |
| Valid redirect URIs | `http://localhost:3000/callback` (exact, no wildcard) |
| Web origins | `http://localhost:3000` |
| PKCE code challenge method | S256 |
| Full scope allowed | Off, with no roles added |
| Client scopes → dedicated mapper | Add an **Audience** mapper: included client audience = `urn:ads:platform:tenant-service`, add to access token = on, add to ID token = off |

## Why the audience mapper specifically matters

It's required, not optional. `tenant-management-api` (unlike `configuration-service`) enforces the token's `aud`
claim before any role check runs (`libs/adsp-service-sdk/src/access/createRealmStrategy.ts` /
`createTenantStrategy.ts`, both pass `audience: serviceAud` straight into `passport-jwt`, which calls
`jsonwebtoken.verify()` — an `aud` mismatch is rejected there, before `req.user` is ever set). Keycloak only
auto-adds a client to `aud` when the token carries a `resource_access` entry for it, and this client deliberately
has zero role grants (`Full scope allowed: Off, no roles`) — so without an explicit mapper, `aud` would never
include `urn:ads:platform:tenant-service`, and `GET /v2/tenants` would 401 even though that route has no role
check of its own. Same technique already used by this codebase's own tenant-admin webapp client
(`createWebappClientConfig` in `apps/tenant-management-api/src/keycloak/configuration.ts`) for the identical
reason — an audience mapper grants no permission by itself, it only makes the token acceptable to that one
service's authentication check.
