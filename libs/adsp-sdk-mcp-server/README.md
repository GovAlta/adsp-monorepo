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

### HTTP transport

To host the server instead of running it per user, start it with `MCP_TRANSPORT=http`. It serves Streamable HTTP
at `POST /mcp`, with a liveness check at `GET /health`.

| Variable | Default | Purpose |
|---|---|---|
| `MCP_TRANSPORT` | `stdio` | `http` to serve HTTP |
| `PORT` | `3000` | Port to listen on |
| `CORS_ORIGIN` | `*` | Value of `Access-Control-Allow-Origin` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset | OTLP/HTTP collector base URL. When set, metrics are exported to `<endpoint>/v1/metrics` |
| `OTEL_METRIC_EXPORT_INTERVAL` | `60000` | Metric export interval, in milliseconds |

HTTP mode is stateless: each `POST /mcp` gets its own MCP server, the response is JSON (the server never streams),
and nothing is kept between requests. The response carries no `Mcp-Session-Id`, so any replica can serve any request
and an idle client never loses its session. `GET /mcp` and `DELETE /mcp` return `405` with `Allow: POST`, because
there is no stream to open and no session to delete.

`SESSION_TTL_MINUTES` has been removed and is ignored: there are no sessions to expire.

#### Metrics

In HTTP mode with `OTEL_EXPORTER_OTLP_ENDPOINT` set, the server exports these OpenTelemetry metrics (meter
`adsp-sdk-mcp-server`, resource `service.name=adsp-sdk-mcp-server`). With no endpoint, nothing is created and the
OpenTelemetry SDK isn't loaded. Stdio mode never exports metrics.

| Name | Kind | Unit | Labels | Meaning |
|---|---|---|---|---|
| `mcp.requests.in_flight` | UpDownCounter | `{request}` | none | `POST /mcp` requests being handled |
| `mcp.requests.rejected` | Counter | `{request}` | `reason` | Requests or tool calls refused by an overload guard |
| `mcp.request.duration` | Histogram | `s` | `mcp.method.name`, `http.response.status_code` | Time to answer a `POST /mcp` request |
| `mcp.tool.duration` | Histogram | `s` | `mcp.tool.name`, `error.type` (absent on success) | Time to run a tool call |
| `mcp.live_tool.upstream.errors` | Counter | `{error}` | `mcp.tool.name`, `error.type` | Failed ADSP calls from `list_service_roles` and `get_service_configuration_schema` |
| `nodejs.eventloop.delay.p50`, `.p99`, `.max` | Gauge | `s` | none | Event-loop delay since the previous export |
| `v8js.memory.heap.used` | Gauge | `By` | none | V8 heap in use |
| `process.memory.usage` | Gauge | `By` | none | Resident set size |
| `mcp.docs_index.build.duration` | Histogram | `s` | none | Time to build the docs index, once per process at startup |

Every label takes a value from a fixed set:

- `mcp.tool.name`: one of the six tool names, or `unknown` for any name the server doesn't have.
- `mcp.method.name`: an MCP method such as `initialize`, `tools/list` or `tools/call`; `other` for any other method;
  `batch` for a JSON-RPC batch; `unparsed` when the body wasn't valid JSON-RPC or was too large.
- `error.type` on `mcp.tool.duration`: `tool_error` (the tool answered with `isError`), `exception` (the tool threw),
  `unknown_tool`, or `busy` (no live-tool slot was free in time).
- `error.type` on `mcp.live_tool.upstream.errors`: `http_4xx`, `http_5xx`, `network`, `not_in_directory`,
  `not_authenticated` or `other`. `not_authenticated` covers both a missing `adsp-cli` login and a failed token
  request, which `adsp-cli` reports the same way.
- `reason` on `mcp.requests.rejected`: `in_flight_cap`, `rate_limit`, `origin` or `live_tool_cap`.

This version has no overload guards yet, so `mcp.requests.rejected` and the `busy` error type are defined but never
recorded.

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

`src/fixtures/tool-contract.golden.json` is maintained by hand. It pins only the docs tools' and the unknown tool's
output over the fixture docs in `src/fixtures/docs`; the other tools are checked for equal output across transports
instead, so SDK reference and quickstart edits don't touch it. If you change docs search or the docs tools' output on
purpose, update the matching entry.

To try it locally against a real MCP client, point the client config's `command`/`args` at the built entry point
instead of `npx`:

```json
{
  "command": "node",
  "args": ["<repo>/dist/libs/adsp-sdk-mcp-server/src/main.js"]
}
```
