---
layout: page
title: Audit service
parent: Services
---

# Audit service

The action catalog registers the classification of audit actions. Registering an action does not
generate audit records. The write endpoint validates and enriches events, but PostgreSQL persistence
and the write buffer are not wired yet. Valid write submissions currently return 503, not a successful
acknowledgment. History queries, SIEM forwarding, and retention execution are separate capabilities.

## Source layout

The `apps/audit-service/src/audit` module follows the Calendar Service layout:

- `model/`: catalog loading and retention configuration resolution.
- `router/`: HTTP routes, write handlers, and OpenAPI definitions.
- `types/`: event payloads and the submission contract.
- `utils/`: event/request validation and write authorization.

`app.ts` initializes the application and registers configuration and roles; `main.ts` starts the
HTTP listener. Tests are colocated with their implementations.

## Authorization

`initializePlatform` registers three roles on `urn:ads:platform:audit-service`:

- `audit-reader`: read access; included in `tenant-admin` via `inTenantAdmin: true`.
- `audit-writer`: event writes; explicitly assigned to application service accounts.
- `audit-admin`: failed-event administration and protected actor identity access;
  does not replace reader/writer permissions.

Every audit route uses `requireAuditRole` to check both the role and resolved tenant.
Core callers may cross tenants but still need the role. Missing/invalid tokens return 401;
insufficient permissions return 403. Discovery, health and Swagger remain public.

New tenants receive the registered roles during provisioning. Existing tenants and Core still
require role provisioning; redeploying this service alone does not synchronize their Keycloak roles.

## Configuration contract

Audit Service registers a namespace-level schema at startup through `initializePlatform` with
`configuration.useNamespace: true`. The definition is the `audit-service` entry in Core
`platform:configuration-service`. It appears under **Configuration service > Definitions > Core definitions**.
Registration follows the SDK's asynchronous startup behavior: inspect registration logs and the stored
definition before onboarding applications; a listening HTTP server alone does not prove registration succeeded.

Each application stores a complete catalog in `audit-service:actions-<application>`, in its tenant
or in Core for shared actions:

```json
{
  "kind": "actionCatalog",
  "application": "case-service",
  "actions": {
    "case.update": {
      "version": 1,
      "category": "administrative",
      "severity": "info",
      "retentionClass": "compliance",
      "resourceType": "case",
      "captureChangeSet": true,
      "forwardToSiem": false,
      "metadataSchema": {
        "type": "object",
        "properties": { "reason": { "type": "string" } }
      }
    }
  }
}
```

`application` is a lowercase kebab-case identifier, at most 40 characters. The API's `namespace`
is this same identifier, **not** the Configuration Service namespace `audit-service`. For an SDK
client it should equal `serviceId.service`. Applications are trusted to register only their own
catalog; Configuration Service roles do not provide application-level write isolation.

Actions require a positive integer `version`, `category` (`administrative`, `runtime`, `security`,
`data-access`), `severity` (`info`, `warning`, `critical`), and a kebab-case `retentionClass`.
Optional fields are `description`, `resourceType`, `captureChangeSet`, `forwardToSiem`, and
`metadataSchema`. The two flags resolve to `false` when omitted. An omitted metadata schema imposes
no action-specific metadata constraint. The listing returns any supplied schema intact.
Unknown document and definition fields are rejected. Action keys omit the event outcome suffix.

The namespace schema also preserves `retentionSettings` and `applicationRetentionSettings` document
shapes, with positive integer `classes.<class>.days`. Catalog registration creates no retention periods.
At write time the service resolves configured periods over the design defaults: standard 90 days,
security and compliance 365 days. See [write-time retention](https://github.com/GovAlta/adsp-monorepo/blob/main/apps/audit-service/README.md#retention-at-write-time)
for configuration names and precedence. Missing custom classes fail writes with a retryable 503.

### Registering through the SDK

`auditDefinitions()` turns application constants into a map keyed by action name and rejects
duplicate names at startup:

```typescript
import { adspId, AuditAction, auditDefinitions } from '@abgov/adsp-service-sdk';

const serviceId = adspId`urn:ads:case-team:case-service`;
const ACTIONS = {
  UPDATE_CASE: {
    name: 'case.update',
    version: 1,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'compliance',
  },
} satisfies Record<string, AuditAction>;

// Include this entry in initializeService's serviceConfigurations.
const serviceConfigurations = [
  {
    serviceId: adspId`urn:ads:platform:audit-service`,
    configuration: [
      {
        name: `actions-${serviceId.service}`,
        operation: 'REPLACE' as const,
        configuration: {
          kind: 'actionCatalog',
          application: serviceId.service,
          actions: auditDefinitions(ACTIONS),
        },
      },
    ],
  },
];
```

Use `initializePlatform` for a Core platform service. The same registration entry then creates a
shared Core catalog. Existing SDK registrations continue to use `UPDATE` unless a named document
explicitly selects `REPLACE`. For direct Configuration Service calls, PATCH the named catalog with
`{ "operation": "REPLACE", "configuration": <complete catalog> }`.

Replacing one application's document cannot delete another application's catalog, including during
concurrent registration. Replacing its action map removes obsolete definitions, unlike a shallow
`UPDATE` merge. Concurrent writers to the _same_ application remain last-writer-wins; coordinate
those deployments. Only trusted administrators/deployment accounts should have write access.

If an active revision is set, changing latest alone may not publish the change. Create and activate
revisions through the normal Configuration Service workflow, with a configuration-admin account.

## Loading and cache behavior

The service reads active revisions with fallback to latest, through the existing SDK configuration
service. It merges tenant and Core maps **by action name**, with the entire Core definition winning
on conflicts. Tenant-only actions remain. An empty tenant catalog does not hide shared Core actions.
The stored `application` must match the requested configuration name.

The SDK caches converted documents by tenant, configuration namespace, and document name. Core
documents are shared deliberately. The combine function uses the SDK's existing memoization.
Tenant `configuration-updated` and `active-revision-set` notifications invalidate the affected
entry; the next request reloads it. Core changes also have the TTL backstop; do not assume a Core
write emits a tenant notification.

`useLongConfigurationCacheTTL` is **false**, retaining the SDK's 900-second (15-minute) TTL.
With Configuration Service available, a missed notification is picked up on the first request
after expiry, plus fetch latency. An update notice normally refreshes on the next request; there is
no measured end-to-end notification latency guarantee yet. Register actions before deploying code
that emits them.

Audit Service uses the SDK's existing error handling. Configuration HTTP or converter failures are
logged and returned as `null`, so the catalog API cannot reliably distinguish these failures from
missing configuration. If neither scope supplies a catalog, listing returns 404; if only one scope
succeeds, it can return a partial catalog. A registered empty catalog retains its `actions: {}`.
Errors that still propagate, such as token acquisition failures, and application-name consistency
failures return 503. On writes, SDK-handled failures can produce unknown-action rejections or
fallback retention periods; reliable failure-versus-absence distinction is not provided.

**Deferred by the MVP scope decision:** stale-on-error after invalidation/expiry, explicit cache
capacity limits, and stronger invalidation/in-flight refresh guarantees. Existing unexpired
configuration cache entries avoid configuration HTTP reads, but token retrieval remains an SDK
dependency. Once an entry expires or is invalidated, a configuration HTTP failure resolves to null;
the SDK does not retain the old value for fallback. These remaining OSP-730 cache guarantees
are not claimed complete.

## Listing definitions

```http
GET /audit/v1/case-service/actions
Authorization: Bearer <token with audit-reader>
```

Returns a JSON array, with each action's `name` plus its definition fields. Optional absent
`resourceType`, `description`, and `metadataSchema` remain omitted.

| Status | Meaning                                                                                |
| ------ | -------------------------------------------------------------------------------------- |
| 200    | Resolved definitions; `[]` means registered but empty.                                 |
| 400    | Invalid application/namespace or tenant ID format.                                     |
| 401    | Not authenticated.                                                                     |
| 403    | No `audit-reader`, or a tenant caller attempted to select a different tenant.          |
| 404    | Neither scope supplied a catalog; SDK-handled failures can also produce this response. |
| 503    | A propagated SDK error or application-name consistency failure; retry.                 |

`audit-reader` is tenant-wide: callers can read any namespace in their tenant, not only their own.
A Core caller with the role can select a tenant via
`?tenantId=urn:ads:platform:tenant-service:v2:/tenants/<id>`. A Core request without tenant context
reads Core catalogs only. The service registers this role for tenant provisioning; existing tenants
still need their normal role provisioning/assignment process.

The catalog governs future write classification, not history access. Removing a definition performs
no audit-record deletion. History readability after deregistration must also be verified when the
history endpoint/storage work is integrated; this scaffold has no history API.

## Writing events

```http
POST /audit/v1/case-service/events
Content-Type: application/json
```

Supply an authenticated bearer token with `audit-writer` and a body
`{ "events": [ ... ] }` containing 1 to 500 events. Configure the Audit Service
audience on the application client and explicitly grant the role to its service
account; `audit-writer` is not automatically assigned to tenant administrators.

The verified token's `azp` must be a service URN. Tenant writers may write only
its service component's namespace. Core writers with the role follow the existing
platform exemption and can select another namespace and tenant through `?tenantId=...`.
Core must supply a tenant. Role provisioning, not an additional claim check,
limits this permission to service accounts.

Events require a UUID `eventId`, `occurredAt`, `action`, `status`, and `actor.id/type`.
Occurrence time must be within the past seven days or next five minutes. Actions
may have a terminal `.succeeded` or `.failed` suffix. An omitted `actionVersion`
uses the current catalog version; an explicit mismatch is rejected.
Resource type and metadata are validated against the resolved action.
Metadata and change sets each have a 16 KiB UTF-8 JSON limit; the whole body has a
20 MiB limit. A non-capturing action drops change sets from the trusted row.

Malformed batch envelopes return 400, oversized bodies return 413, and malformed
individual events produce individual rejections. Classification, identity and
retention columns are server-set, never copied from caller-supplied row fields.

Once a durable submitter is connected, 202 returns:

```json
{ "accepted": 1, "duplicates": 0, "rejected": [] }
```

Each rejection includes a zero-based input `index`, `code`, `reason`, and an
`eventId` when available. Counts and rejection length account for every input.
Duplicates are determined by PostgreSQL, not an in-memory router check.
Until that integration exists, valid submissions return **503 with Retry-After**.

See the [submission contract](https://github.com/GovAlta/adsp-monorepo/blob/main/apps/audit-service/README.md#submission-contract-osp-707--osp-708)
for the boundary with OSP-708.

## Failed-event administration (OSP-709)

**Integration status:** the API, replay orchestration, metrics and repository contracts are
implemented against main. OSP-705 (PostgreSQL), OSP-708 (durability) and OSP-711 (self-auditing)
are not integrated. The application deliberately returns **503 with `Retry-After: 1`** for
authorized administration requests until a `FailedEventRepository` is injected into
`initializeApp`. Neither durable recovery nor concurrency/rollback guarantees have been
verified against PostgreSQL. There is no in-memory substitute and no successful empty fallback.

Both endpoints require `audit-admin`; `audit-reader` and `audit-writer` alone are refused.
Normal callers use their resolved tenant. Core administrators must supply `tenantId`;
the existing Core cross-tenant exemption still requires the admin role.

| Endpoint                                   | Contract once persistence is connected                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `GET /audit/v1/failed-events`              | All tenant parked rows, including open/replayed/discarded, ordered by `failed_at DESC, id DESC`.     |
| `POST /audit/v1/failed-events/{id}/replay` | Replay an open row and return its updated failed-event record after commit. No request body is used. |

Listing uses `top` (default 20, maximum 100) and `after` with the shared `Results<T>` shape:
`{ results, page: { after?, size, next? } }`. Cursors use `decodeAfter`/`encodeNext`; invalid,
negative or unsafe offsets return 400. A full page may point to an empty final page.
Offset paging is not a snapshot; new failures can shift rows between requests.
Records contain the original JSON input and storage error, so access is admin-only.

Replay returns 404 for IDs absent from the resolved tenant and 409 for replayed or discarded
rows. The recovered event keeps the original actor; its `written_by` is the Audit Service client
URN. `replayed_as` is the stored row's `id`, not the original `event_id`. The accompanying
self-audit uses namespace `audit-service`, action `failed-event.replay.succeeded`, the requesting
administrator as actor, and `{ replayedAs }` metadata. The self-audit is distinct from the
recovered original event and is not sent through the Event Service.

### Persistence integration contract

`FailedEventRepository` and `FailedEventReplayTransaction` are in
`apps/audit-service/src/audit/types/failed-events.ts`. The adapter must:

- Filter every list/lookup/update by the trusted tenant and set PostgreSQL RLS context.
- Lock the failed row inside `withReplayTransaction`, before checking its status; concurrent
  requests must serialize. Never rely on the handler's status check without a database lock.
- Validate and enrich stored input in `insertReplayedEvent`, preserving its actor, namespace
  and event ID and using the supplied service writer. Do not reapply the ingestion age window
  to an old parked event. Apply the catalog, retention and idempotency rules from the storage
  implementation; do not trust identity/classification fields embedded in raw JSON.
- Atomically insert the recovered row, mark/link the failed row and insert the self-audit.
  Register/resolve the self-audit action through OSP-711. Any failure, including self-audit or
  commit failure, must reject and roll back all changes. Do not inject a partially implemented
  adapter or defer self-auditing as fire-and-forget work.
- Resolve the transaction only after commit and return the actual stored audit row ID.
- Provide a privileged `countOpen()` aggregate across tenants without exposing event payloads.

The transaction tests exercise orchestration and failure propagation with mocks; real RLS,
idempotency, actor preservation during enrichment, concurrent replays and rollback remain
integration acceptance work for those dependencies. Writing parked rows, retry policy,
discard operations and expiry of closed rows are not implemented by this change.

### Metrics and alerting

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to the collector's base HTTP URL (for example
`http://otel-collector:4318`). The SDK's `initializePlatform.metrics` exports OTLP metrics.
The environment ConfigMap includes this setting; no exporter runs when it is empty.

| Prometheus series                                            | Meaning                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `audit_failed_events_open`                                   | Durable count of all open rows, refreshed from storage each collection.                                                  |
| `audit_failed_events_available`                              | 1 when the count was read successfully, 0 if integration is missing or collection fails.                                 |
| `audit_events_parked_total`                                  | Durably parked events, via `recordParkedEvent()` after a successful parking commit.                                      |
| `audit_write_failures_total{operation="ingest" \| "replay"}` | Failed durable saves. Replay transaction failures are wired; OSP-708 must call the ingest hook for failed durable saves. |

These metrics carry no actor, event ID, error text or tenant labels. A missing/failed count is
logged and reported as `NaN` (unknown), not zero. This replaces any previously observed count
that the SDK could otherwise retain. Until storage is connected, availability is 0 and the
open count is unknown. Buffer parking and ingest failure counters are hooks only until
OSP-708 connects them; they must not count validation errors or every retry attempt.

The observability template loads `audit-alerts.yml` in Prometheus. `AuditOpenFailedEvents`
fires at **`max by (deployment_environment) (audit_failed_events_open) > 0`**, with no `for` delay.
`max`, not `sum`, avoids counting the shared database once per replica. The first single
open row is sufficient, subject to metric export, scrape and evaluation intervals.
`AuditFailedEventCountUnavailable` flags failed count collection. Rules do not by themselves
configure notification delivery or detect an entirely absent exporter; see the
[observability setup](https://github.com/GovAlta/adsp-monorepo/blob/main/.openshift/observability/README.md).
