---
layout: page
title: Audit service
parent: Services
---

# Audit service

The action catalog registers the classification of audit actions. Registering an action does not
generate audit records. The write endpoint validates and enriches events. A standalone write buffer
is implemented, but database persistence and runtime integration are not wired yet.
Valid write submissions currently return 503, not a successful
acknowledgment. History queries, SIEM forwarding, and retention execution are separate capabilities.

## Source layout

The `apps/audit-service/src/audit` module follows the Calendar Service layout:

- `model/`: catalog loading and retention configuration resolution.
- `buffer/`: write scheduling, durability handling and the pending database adapter contract.
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
security and compliance 365 days. Application settings in `audit-service:retention-<application>`
override `audit-service:retention`, which overrides those defaults. Expiry is calculated from
`occurred_at` in UTC days. Missing custom classes fail writes with a retryable 503.

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

## Write buffer

The router submits enriched events through
`submit(events: EnrichedEvent[]): Promise<Map<string, EventOutcome>>`.
Results use the service-generated `id`, never client `event_id`, to keep concurrent requests
and tenants separate. Inputs must remain unchanged until the promise settles.

The buffer batches at 200 events or 200 ms, with default limits of 5,000 retained events and
32 MiB of serialized payload per pod. Capacity is reserved for the whole request before enqueueing;
over-capacity requests return 503 without storing any of their events. The byte limit is not a
measurement of process memory.

Transient failures retry after 200 ms, 1 s and 3 s; constraint failures are retried individually.
`accepted` requires a committed audit row. `storage_failed` requires the original event to be
committed to failed-event storage and is counted as rejected, not accepted. If neither write
succeeds, the request returns 503. The future database adapter must use
`ON CONFLICT (tenant_id, namespace, event_id) DO NOTHING RETURNING id`, resolve only after commit,
and honour cancellation.

`close()` refuses new submissions and drains within a configurable 25-second default budget,
reserving the final 5 seconds for failed-event storage. Database integration, process signal and
readiness wiring, and real persistence, memory and rolling-deployment acceptance remain pending.

## Failed-event administration

**Not connected to storage yet:** authorized requests return **503 with `Retry-After: 1`**
until database and self-auditing integration is complete. The OSP-708 write buffer is present,
but real event recovery is not available.

Both endpoints require `audit-admin` and use the caller's tenant. Core administrators must
provide `tenantId`. Reader or writer permissions alone are not enough.

| Endpoint                                   | Purpose once storage is connected                                     |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `GET /audit/v1/failed-events`              | List the tenant's open, replayed and discarded events, newest first.  |
| `POST /audit/v1/failed-events/{id}/replay` | Retry an open event using its stored data. No request body is needed. |

Listing accepts `top` (default 20, maximum 100) and the previous response's `page.next` as
`after`. It returns `{ results, page: { after?, size, next? } }`.

Replay returns 404 if the event is not found in the tenant, or 409 if already replayed or
discarded. The original actor is preserved; `written_by` identifies the Audit Service.
`replayed_as` links to the recovered audit row. A separate audit event records who requested
the replay.

### Remaining integration

Implement `FailedEventRepository` in `apps/audit-service/src/audit/types/failed-events.ts`
and pass it to `initializeApp`. The database adapter must enforce tenant isolation, prevent
concurrent duplicate replays, and save the recovered event, status update and replay audit
record in one transaction: either all succeed or none do. Old parked events must not be
rejected by the normal seven-day submission limit.

Map the buffer's `attempt_count` to the API's `attempts`, and provide `countOpen()` for monitoring.
Real database recovery and rollback still need integration testing.

### Monitoring

`OTEL_EXPORTER_OTLP_ENDPOINT` sets where metrics are sent, for example
`http://otel-collector:4318`. Leaving it empty disables metric export.

The rules in `.openshift/observability/observability-stack.yml` alert when **at least one
failed event is still open**, or when the count cannot be read. An unavailable count is
unknown, not zero. Detection follows the monitoring update cycle; email or message delivery
needs separate configuration.

Open-event counts still require database integration. The parked-event and failed-ingest
counter hooks also need to be connected to the write buffer.
