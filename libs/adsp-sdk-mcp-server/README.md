# @abgov/adsp-sdk-mcp-server

An MCP (Model Context Protocol) server that gives an AI coding assistant grounded, sourced answers about the
[Alberta Digital Service Platform](https://govalta.github.io/adsp-monorepo) (ADSP) and the Node SDK
(`@abgov/adsp-service-sdk`), instead of guessing.

It bundles the ADSP documentation site content and a curated reference of every `@abgov/adsp-service-sdk` export,
and exposes them over stdio via four tools:

- `search_adsp_docs` — keyword search across ADSP platform docs (getting started, architecture, service concepts,
  tutorials).
- `read_adsp_doc` — read the full content of a doc page found via search.
- `search_sdk_reference` — search `@abgov/adsp-service-sdk` by symbol name, module, or keyword; returns full symbol
  details (kind, description, option/return shape, example, deprecated flag).
- `get_platform_quickstart` — the canonical `initializeService` usage pattern (the common case for a tenant service
  built on top of ADSP) and a capabilities summary, for the most common question: how to start using ADSP from a
  Node service.

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
