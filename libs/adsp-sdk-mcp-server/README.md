# @abgov/adsp-sdk-mcp-server

An MCP (Model Context Protocol) server that gives an AI coding assistant grounded, sourced answers about the
[Alberta Digital Service Platform](https://govalta.github.io/adsp-monorepo) (ADSP) and the Node SDK
(`@abgov/adsp-service-sdk`), instead of guessing.

It bundles the ADSP documentation site content and a curated reference of every `@abgov/adsp-service-sdk` export,
and exposes them over stdio via eight tools:

- `search_adsp_docs` — keyword search across ADSP platform docs (getting started, architecture, service concepts,
  tutorials). Common words people use that the docs don't, such as `websocket` or `auth`, also search for the
  docs' own terms (`src/search/aliases.ts`).
- `list_adsp_docs` — list the path and title of every bundled doc page, optionally under a path prefix such as
  `services/`, for browsing when keyword search misses.
- `read_adsp_doc` — read the full content of a doc page found via search or the list.
- `search_sdk_reference` — search `@abgov/adsp-service-sdk` by symbol name, module, or keyword; returns full symbol
  details (kind, description, option/return shape, example, deprecated flag).
- `get_platform_quickstart` — the canonical `initializeService` usage pattern (the common case for a tenant service
  built on top of ADSP) and a capabilities summary, for the most common question: how to start using ADSP from a
  Node service.
- `list_service_roles` — **live: talks to a real ADSP environment**, not bundled/offline data. Reads every platform
  service's registered RBAC role from tenant-service configuration, so an agent can pick a least-privileged role
  instead of defaulting to an admin role.
- `get_service_configuration_schema` — **live.** Reads platform services' configuration schemas from
  configuration-service, for the shape of `serviceConfigurations` entries in `initializeService`.
- `get_adsp_mcp_server_info` — this server's version and where its bundled content came from: the docs source
  commit, the `@abgov/adsp-service-sdk` version the SDK reference matches, and the release time. Lets an agent warn
  that an answer may be stale.

The two live tools require logging in first (see below). Everything else in this package works fully offline with no
setup.

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
| `CORS_ORIGIN` | unset | Comma-separated browser origins allowed to call `/mcp`, for example `https://a.example,https://b.example`. Unset allows none; `*` allows any (not for hosted use) |
| `MCP_MAX_IN_FLIGHT` | `64` | `POST /mcp` requests handled at once per process |
| `MCP_IN_FLIGHT_WAIT_MS` | `1000` | How long a request waits for a free slot before getting `503`. Also how long a live tool waits for a free upstream slot |
| `MCP_RATE_LIMIT_PER_MINUTE` | `1200` | `POST /mcp` requests allowed per client IP per minute, per process. `0` turns the limit off |
| `MCP_LIVE_TOOL_MAX_CONCURRENT` | `8` | Live-tool calls to ADSP running at once per process, across both live tools |
| `TRUSTED_PROXY` | `uniquelocal` | Express [`trust proxy`](https://expressjs.com/en/guide/behind-proxies.html) setting, so the client IP comes from the router's `X-Forwarded-For` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset | OTLP/HTTP collector base URL. When set, metrics are exported to `<endpoint>/v1/metrics` |
| `OTEL_METRIC_EXPORT_INTERVAL` | `60000` | Metric export interval, in milliseconds |

An invalid value for one of the `MCP_*` numbers, or `*` mixed with origins in `CORS_ORIGIN`, stops the server at
startup with an error naming the variable.

HTTP mode is stateless: each `POST /mcp` gets its own MCP server, the response is JSON (the server never streams),
and nothing is kept between requests. The response carries no `Mcp-Session-Id`, so any replica can serve any request
and an idle client never loses its session. `GET /mcp` and `DELETE /mcp` return `405` with `Allow: POST`, because
there is no stream to open and no session to delete.

`SESSION_TTL_MINUTES` has been removed and is ignored: there are no sessions to expire.

#### Overload guards

`POST /mcp` passes these checks in order. `GET /health` skips all of them. Every rejection is a JSON-RPC error body
(`code: -32000`) and is counted in `mcp.requests.rejected`.

1. **Origin.** A request with an `Origin` header not in `CORS_ORIGIN` gets `403` (`Origin not allowed`), as the MCP
   specification requires. `Origin: null` is never allowed. A request without an `Origin` header, which is what
   non-browser clients such as agent-service and the MCP SDK send, passes. `Access-Control-Allow-Origin` is sent only
   for an allowed origin.
2. **Rate limit.** Over `MCP_RATE_LIMIT_PER_MINUTE` from one client IP, a request gets `429` with `Retry-After`
   (`Rate limit exceeded`).
3. **In-flight cap.** With `MCP_MAX_IN_FLIGHT` requests already running, a request waits up to
   `MCP_IN_FLIGHT_WAIT_MS` for a slot, so a short burst completes. A request still waiting after that, or arriving
   when as many requests are already waiting as `MCP_MAX_IN_FLIGHT`, gets `503` with `Retry-After: 1`
   (`Server busy`). Requests already running are never affected. A request is admitted before its body arrives, so
   the server allows 20 s for the headers and 30 s for the whole request. A client that sends more slowly is closed
   and its slot freed. These limits don't apply to how long a tool call takes.

The live tools also share `MCP_LIVE_TOOL_MAX_CONCURRENT` slots for their calls to ADSP. A live-tool call that can't
get one within `MCP_IN_FLIGHT_WAIT_MS` answers with the tool error `ADSP upstream is busy. Retry shortly.` instead of
waiting on a slow upstream. A live-tool call whose client cancels it or disconnects while it waits gives up its
place and never calls ADSP. This applies in stdio mode too.

Things to know when sizing and tuning these:

- **The limits are per process.** With N replicas, the cluster takes about N times each limit.
- **The rate limit is per client IP until authentication is added.** Every agent-service pod is then one client, and
  so is any group of users behind one NAT or proxy. Connecting and calling one tool is 3 `POST`s, so the default
  allows about 400 such client sessions a minute from one IP. Retune it once the deployment shows which client IPs
  reach the pod.
- **Clients don't retry.** Measured locally with `MCP_MAX_IN_FLIGHT=2` and both slots held:

  | Client | Over the cap for longer than `MCP_IN_FLIGHT_WAIT_MS` | Over the cap briefly (`MCP_IN_FLIGHT_WAIT_MS=3000`, slots freed after 0.5 s) |
  |---|---|---|
  | `@modelcontextprotocol/sdk` 1.32.1 | `connect()` throws `StreamableHTTPError` (code 503) after the wait. One request, no retry, `Retry-After` ignored | Connects and calls the tool after about 0.5 s |
  | `@mastra/mcp` 1.8.1 | Logs `MCP_CLIENT_GET_TOOLS_FAILED` and `listTools()` returns no tools from this server, without throwing. One request, no retry | Lists all tools and calls one after about 0.5 s |

  So a `503` becomes a failed tool call, or an agent turn with no ADSP tools at all. Size `MCP_MAX_IN_FLIGHT` and
  the replica count so it stays rare, and watch `mcp.requests.rejected`.

#### Metrics

In HTTP mode with `OTEL_EXPORTER_OTLP_ENDPOINT` set, the server exports these OpenTelemetry metrics (meter
`adsp-sdk-mcp-server`, resource `service.name=adsp-sdk-mcp-server`). With no endpoint, nothing is created and the
OpenTelemetry SDK isn't loaded. Stdio mode never exports metrics.

| Name | Kind | Unit | Labels | Meaning |
|---|---|---|---|---|
| `mcp.requests.in_flight` | UpDownCounter | `{request}` | none | `POST /mcp` requests admitted by the in-flight cap and not yet answered (waiting requests aren't counted) |
| `mcp.requests.rejected` | Counter | `{request}` | `reason` | Requests or tool calls refused by an overload guard |
| `mcp.request.duration` | Histogram | `s` | `mcp.method.name`, and `http.response.status_code` or `error.type=aborted` | Time to answer a `POST /mcp` request, or until the client disconnected |
| `mcp.tool.duration` | Histogram | `s` | `mcp.tool.name`, `error.type` (absent on success) | Time to run a tool call |
| `mcp.live_tool.upstream.errors` | Counter | `{error}` | `mcp.tool.name`, `error.type` | Failed ADSP calls from `list_service_roles` and `get_service_configuration_schema` |
| `nodejs.eventloop.delay.p50`, `.p99`, `.max` | Gauge | `s` | none | Event-loop delay since the previous export |
| `v8js.memory.heap.used` | Gauge | `By` | none | V8 heap in use |
| `process.memory.usage` | Gauge | `By` | none | Resident set size |
| `mcp.docs_index.build.duration` | Histogram | `s` | none | Time to build the docs index, once per process at startup |

Every label takes a value from a fixed set:

- `mcp.tool.name`: one of the eight tool names, or `unknown` for any name the server doesn't have.
- `mcp.method.name`: an MCP method such as `initialize`, `tools/list` or `tools/call`; `other` for any other method;
  `batch` for a JSON-RPC batch; `unparsed` when the body wasn't valid JSON-RPC or was too large.
- `error.type` on `mcp.request.duration`: `aborted` when the client disconnected before the response was written; the
  status code is then left out.
- `error.type` on `mcp.tool.duration`: `tool_error` (the tool answered with `isError`), `exception` (the tool threw),
  `unknown_tool`, or `busy` (no live-tool slot was free in time).
- `error.type` on `mcp.live_tool.upstream.errors`: `http_4xx`, `http_5xx`, `network`, `not_in_directory`,
  `not_authenticated` or `other`. `not_authenticated` covers both a missing `adsp-cli` login and a failed token
  request, which `adsp-cli` reports the same way.
- `reason` on `mcp.requests.rejected`: `in_flight_cap`, `rate_limit`, `origin` or `live_tool_cap`.

### Using the live tools

`list_service_roles` and `get_service_configuration_schema` need a real ADSP environment and a logged-in session (via `@abgov/adsp-cli`, a separate package this
one depends on). One-time setup — no MCP client config changes needed:

```bash
npx @abgov/adsp-cli login --tenant "My Tenant"
# or --realm <realm> if you already know it, or no args to pick interactively from the full tenant list
```

`login` persists the resolved realm, so the MCP server just works after that — no `env` block required in the MCP
client config. `ADSP_TENANT_REALM` remains available as an optional override (e.g. CI, or switching contexts).

The same role data is also available directly from a terminal, without an MCP client at all: `npx @abgov/adsp-cli
service-roles`.

If either live tool is called without a valid login, it returns a clear, actionable error (telling you to run
`npx @abgov/adsp-cli login`) rather than failing silently or hanging — it never opens a browser or blocks waiting for
one itself.

## Development

```bash
nx build adsp-sdk-mcp-server
nx test adsp-sdk-mcp-server
nx lint adsp-sdk-mcp-server
```

### Refresh workflow

The bundled content is refreshed from source on every release, not fetched live:

- **Docs.** The build copies `docs/**/*.md` into the package. `src/docs/docs-lock.json` fingerprints those pages, and
  `src/docs/docsLock.spec.ts` fails CI when `docs/` changes without it. In a PR that changes `docs/`, run
  `npx nx run adsp-sdk-mcp-server:update-docs-lock` and commit the lock. The lock is inside this package, so the
  change releases it: `.releaserc.json` releases a patch for `docs` commits as well as `feat` and `fix`.
- **SDK reference.** Maintained by hand, and checked against the SDK source (below).
- **Provenance.** The `release` target runs `scripts/provenance.mjs` before publishing. It writes
  `provenance.json` into the package with the source commit, the last commit to `docs/`, the latest
  `adsp-service-sdk` release tag and whether the SDK source has changed since. `get_adsp_mcp_server_info` reports it,
  and reports no provenance when running from source or a local build.
- **Hosted builds from a branch** (the ARO deployment in `GovAlta-EMU/osp-mcp-servers` builds `main`, not a
  release) run `node libs/adsp-sdk-mcp-server/scripts/provenance.mjs --source-build` after `nx build`, with a
  `fetch-depth: 0` checkout. It records the same provenance and sets the built version to
  `<latest release>+<branch>.<short sha>`, e.g. `1.25.0+main.8b3ef02`, instead of the source `package.json`
  placeholder.

`src/sdk-reference/reference.ts` is maintained by hand. `reference.spec.ts` reads the root exports of
`libs/adsp-service-sdk/src/index.ts` with the TypeScript compiler and fails when the reference drifts: a missing or
stale name, or a different kind, module or deprecated flag, or a `seeAlso` with no entry. When you change what the SDK
exports, update `reference.ts` in the same PR.

`src/fixtures/tool-contract.golden.json` is maintained by hand. It pins only the docs tools' and the unknown tool's
output over the fixture docs in `src/fixtures/docs`; the other tools are checked for equal output across transports
instead, so SDK reference and quickstart edits don't touch it. If you change docs search or the docs tools' output on
purpose, update the matching entry.

### Bundled OpenAPI specs

`api-specs/` holds each service's OpenAPI spec as minified JSON, plus `index.json` (app, service URN, name,
operation count). `scripts/api-specs.mjs` generates them the way each service's webpack build does: `swagger-jsdoc`
over `apps/<app>/swagger.config.js`, `apps/<app>/src/**/*.ts` and `apps/<app>/src/**/*.swagger.yml`. pii-service
uses its static `swagger.yml`. The build copies them to `assets/api-specs`.

`src/api-specs/apiSpecs.spec.ts` fails CI when a service's spec changes without regenerating, or when an app with a
`swagger.config.js` is in neither `services` nor `excluded` in `scripts/api-services.json`. To regenerate:

```bash
npx nx run adsp-sdk-mcp-server:generate-api-specs
```

To try it locally against a real MCP client, point the client config's `command`/`args` at the built entry point
instead of `npx`:

```json
{
  "command": "node",
  "args": ["<repo>/dist/libs/adsp-sdk-mcp-server/src/main.js"]
}
```
