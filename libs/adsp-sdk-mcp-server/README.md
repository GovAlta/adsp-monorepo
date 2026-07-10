# @abgov/adsp-sdk-mcp-server

An MCP (Model Context Protocol) server that gives an AI coding assistant grounded, sourced answers about the
[Alberta Digital Service Platform](https://govalta.github.io/adsp-monorepo) (ADSP) and the Node SDK
(`@abgov/adsp-service-sdk`), instead of guessing.

It bundles the ADSP documentation site content and a curated reference of every `@abgov/adsp-service-sdk` export,
and exposes them over stdio via five tools:

- `search_adsp_docs` — keyword search across ADSP platform docs (getting started, architecture, service concepts,
  tutorials).
- `read_adsp_doc` — read the full content of a doc page found via search.
- `search_sdk_reference` — search `@abgov/adsp-service-sdk` by symbol name, module, or keyword; returns full symbol
  details (kind, description, option/return shape, example, deprecated flag).
- `get_platform_quickstart` — the canonical `initializeService` usage pattern (the common case for a tenant service
  built on top of ADSP) and a capabilities summary, for the most common question: how to start using ADSP from a
  Node service.
- `list_service_roles` — **the one tool that talks to a real ADSP environment**, not bundled/offline data. Reads
  every platform service's registered RBAC role live from tenant-service configuration, so an agent can pick a
  least-privileged role instead of defaulting to an admin role. Requires logging in first (see below) — everything
  else in this package works fully offline with no setup.

This package covers the Node SDK only. Other language SDKs (`.NET`, Django, Flask, Spring) are out of scope for now.

The SDK has two entry points for two different kinds of service: `initializeService` for tenant services (the
primary audience for this package — product teams building on top of ADSP) and `initializePlatform` for cross-tenant
platform services (the ones that live in this monorepo, e.g. `directory-service`, `configuration-service`). Content
here is weighted toward `initializeService` accordingly.

## Usage

Add it to your MCP client's server config, run via `npx`:

```json
{
  "mcpServers": {
    "adsp-sdk": {
      "command": "npx",
      "args": ["-y", "@abgov/adsp-sdk-mcp-server"]
    }
  }
}
```

### Using `list_service_roles`

That one tool needs a real ADSP environment and a logged-in session (via `@abgov/adsp-cli`, a separate package this
one depends on). One-time setup — no MCP client config changes needed:

```bash
npx @abgov/adsp-cli login --tenant "My Tenant"
# or --realm <realm> if you already know it, or no args to pick interactively from the full tenant list
```

`login` persists the resolved realm, so the MCP server just works after that — no `env` block required in the MCP
client config. `ADSP_TENANT_REALM` remains available as an optional override (e.g. CI, or switching contexts).

The same role data is also available directly from a terminal, without an MCP client at all: `npx @abgov/adsp-cli
service-roles`.

If `list_service_roles` is called without a valid login, it returns a clear, actionable error (telling you to run
`npx @abgov/adsp-cli login`) rather than failing silently or hanging — it never opens a browser or blocks waiting for
one itself.

## Development

```bash
nx build adsp-sdk-mcp-server
nx test adsp-sdk-mcp-server
nx lint adsp-sdk-mcp-server
```

To try it locally against a real MCP client, point the client config's `command`/`args` at the built entry point
instead of `npx`:

```json
{
  "command": "node",
  "args": ["<repo>/dist/libs/adsp-sdk-mcp-server/src/main.js"]
}
```
