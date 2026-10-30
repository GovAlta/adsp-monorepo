---
layout: page
title: Audit service
parent: Services
---

# Audit service

Audit Service stores tenant-scoped audit records: who did what, when, to which resource, and with
what outcome. Applications register **action definitions**, then explicitly submit **events**.
Registering an action does not create an audit record.

Use the `auditService` capability in `@abgov/adsp-service-sdk`, or call the REST API directly.
There is no separate Audit SDK package. Action catalogs and retention settings live in
Configuration Service; committed events live in PostgreSQL.

## Prepare access

Start with the [Node.js SDK service-account setup](../platform/platform-node-sdk.md#setting-up-a-service-account).
Use an SDK release that includes `auditActions`, `auditService.record()` and `auditService.query()`.
Keep client secrets in approved secret storage, never in source code.

| Identifier | Example | Purpose |
| --- | --- | --- |
| Application client ID | `urn:ads:case-team:case-service` | Keycloak client and SDK `serviceId`. |
| Audit namespace | `case-service` | The service component of the client ID: `serviceId.service`. |
| Audit Service client | `urn:ads:platform:audit-service` | Owns the Audit roles and required token audience. |
| API discovery ID | `urn:ads:platform:audit-service:v1` | Resolves the environment's Audit API URL. |
| Action catalog | `audit-service:actions-case-service` | Configuration namespace and document name. |

Audit namespaces must be lowercase kebab-case, at most 40 characters. A tenant writer can write
only to the namespace derived from its verified client identity (`azp`). Readers can read all
namespaces within their tenant. Core callers need the appropriate role and an explicit target
tenant for event writes and history reads.

### Roles and audience

These client roles belong to `urn:ads:platform:audit-service`:

| Role | Permission | Included in `tenant-admin` |
| --- | --- | --- |
| `audit-reader` | Read action definitions and audit history. | Yes, after provisioning. |
| `audit-writer` | Submit audit events. | No; assign explicitly. |
| `audit-admin` | Administer failed events and access protected actor identity. | No; assign only when needed. |

`audit-admin` does not replace reader or writer permissions.

1. In **Tenant Management App > Access > Service roles**, find Audit Service, including under
   **Core service roles**. Use **Action > +** to provision missing roles in the tenant realm.
2. In Keycloak, open the **calling application's client**. Under **Client scopes**, open its
   dedicated scope and add an **Audience** mapper with **Included Client Audience** set to
   `urn:ads:platform:audit-service`. Include it in the access token.
3. Under **Service account roles**, assign `audit-writer` from the Audit Service client.
   Also assign `audit-reader` if the application needs to query records.
4. Obtain a fresh client-credentials token. Verify its audience, roles and `azp` locally;
   never paste tokens into public decoding services.

**Provisioning a role is not the same as assigning it to an application.** Redeploying Audit
Service alone does not provision missing roles in existing realms. If the service is absent,
ask an administrator to check the environment and tenant/Core registration views.

Action registration separately requires Configuration Service access and audience. The standard
SDK registration path uses `configured-service`; creating and activating revisions requires an
authorized `configuration-admin`. `audit-writer` alone cannot publish action definitions.

## Integrate with the Node.js SDK

The examples run in asynchronous application code. `config` is validated deployment configuration
and `logger` is a Winston logger. Replace the illustrative client, actor and resource identifiers
with your application's values.

### Define the actions

Use base action names without a terminal `.succeeded` or `.failed` suffix.

```typescript
import {
  AdspId,
  adspId,
  AuditCategories,
  AuditSeverities,
  BuiltInRetentionClasses,
  initializePlatform,
  initializeService,
} from '@abgov/adsp-service-sdk';
import type { AuditAction } from '@abgov/adsp-service-sdk';

const ACTIONS = {
  UPDATE_CASE: {
    name: 'case.update',
    version: 1,
    category: AuditCategories.Administrative,
    severity: AuditSeverities.Info,
    retentionClass: BuiltInRetentionClasses.Compliance,
    resourceType: 'case',
    captureChangeSet: true,
    metadataSchema: {
      type: 'object',
      properties: { reason: { type: 'string' } },
      required: ['reason'],
      additionalProperties: false,
    },
  },
} satisfies Record<string, AuditAction>;
```

### Tenant application: `initializeService`

A tenant application supplies its realm. Its service-account token determines the tenant.

```typescript
const { auditService } = await initializeService(
  {
    serviceId: adspId`urn:ads:case-team:case-service`,
    displayName: 'Case service',
    description: 'Case management',
    realm: config.realm,
    clientSecret: config.clientSecret,
    accessServiceUrl: new URL(config.accessServiceUrl),
    directoryUrl: new URL(config.directoryUrl),
    auditActions: ACTIONS,
  },
  { logger },
);
```

### Core platform service: `initializePlatform`

Use this **instead of** the tenant initialization above for a Core service. It automatically
uses the `core` realm and registers a shared Core catalog; do not pass a `realm` option.
Use credentials for the Core client, not the tenant application's client.

```typescript
const { auditService } = await initializePlatform(
  {
    serviceId: adspId`urn:ads:platform:case-service`,
    displayName: 'Case service',
    description: 'Multi-tenant case management',
    clientSecret: config.clientSecret,
    accessServiceUrl: new URL(config.accessServiceUrl),
    directoryUrl: new URL(config.directoryUrl),
    auditActions: ACTIONS,
  },
  { logger },
);

const tenantId = AdspId.parse(config.tenantId);

const outcome = await auditService.record(ACTIONS.UPDATE_CASE, {
  tenantId,
  actor: { id: 'onboarding-test-user', type: 'user' },
  resource: { type: 'case', id: 'onboarding-case-001' },
  metadata: { reason: 'Onboarding verification' },
});

if (outcome.status !== 'recorded') {
  logger.error('Audit event was not confirmed recorded', { outcome });
  throw new Error(`Audit write failed: ${outcome.status}`);
}

const history = await auditService.query(
  { resourceType: 'case', resourceId: 'onboarding-case-001' },
  { tenantId, top: 20 },
);
```

`config.tenantId` must be a tenant URN such as
`urn:ads:platform:tenant-service:v2:/tenants/<tenant-id>`, taken from trusted tenant context.
Core callers must pass this `AdspId` in **record details** and **query options**, as shown above.
Tenant applications use the same calls but omit `tenantId`.

### Event content and delivery

`record()` supplies a UUID `eventId`, the current `occurredAt`, and business `status: 'success'`
when omitted. Supply these explicitly when preserving an event for later delivery. Business
status can be `success`, `failure`, `blocked` or `error`; it is separate from the delivery outcome.

To capture changes, set `captureChangeSet: true` on the action and add
`changeSet: { before: { state: 'draft' }, after: { state: 'submitted' } }` to the record details.
Otherwise the SDK drops the change set before sending. Record only necessary data; never include
credentials or unnecessary personal information.

**Always await `record()` and inspect its outcome.** It does not reject to report write failures.

| Outcome | Meaning | Response |
| --- | --- | --- |
| `recorded` | A committed audit row or an existing idempotent duplicate was confirmed. | Continue. |
| `rejected` | The service returned a per-event `code` and `reason`. | Investigate; the SDK does not resubmit it automatically. |
| `failed` | Delivery failed or could not be confirmed; includes `reason` and `error`. | Apply an explicit recovery policy; the event may already be stored. |

The SDK sends events immediately by default. It retries network errors, timeouts and HTTP
429/502/503/504 with the same IDs. For application-level retries, preserve the original event,
including its `eventId` and `occurredAt`; a new ID can create a duplicate after a lost response.

Optional client batching is enabled with `audit: { batchSize: 100, batchIntervalMs: 500 }` in
either initializer. Pending, in-flight and retrying work defaults to a maximum of 1,000 events
or 8 MiB of serialized data; excess events fail with `buffer_full`. This buffer is in memory,
not durable recovery storage.

Monitor `auditService.droppedEventCount` and the `audit.client.dropped_events` metric.
Before shutdown, stop accepting new work and call `await auditService.flush()` if unawaited
records or batches remain. No separate flush is needed once all `record()` calls have settled.
Forced termination can lose pending work.

## Register and publish actions

`auditActions` replaces the complete `audit-service:actions-<serviceId.service>` catalog.
Include every action that must remain registered and coordinate deployments of the same
application: concurrent replacements are last-writer-wins. Other applications' catalogs are
separate. Only trusted deployment identities should publish catalogs; Configuration Service
permissions do not enforce application-level write isolation.

Each definition requires a positive integer `version`, `category` (`administrative`, `runtime`,
`security`, `data-access`), `severity` (`info`, `warning`, `critical`) and a kebab-case
`retentionClass`. Optional fields include `description`, `resourceType`, `metadataSchema`,
`captureChangeSet` and `forwardToSiem`. Both flags default to false; SIEM forwarding is a separate
capability. Shared Core definitions win over tenant definitions with the same action name.

### Register without the SDK

Through [Configuration Service](configuration-service.md), PATCH the document in namespace
`audit-service`, name `actions-case-service`, using this complete-document replacement:

```json
{
  "operation": "REPLACE",
  "configuration": {
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
        "metadataSchema": {
          "type": "object",
          "properties": { "reason": { "type": "string" } },
          "required": ["reason"],
          "additionalProperties": false
        }
      }
    }
  }
}
```

### Confirm publication

If an active revision exists, updating latest alone does not publish the change. Create and
activate the intended revision through Configuration Service.

Registration is asynchronous. SDK writes wait for registration to settle, **not** for proof
that it succeeded or every Audit Service instance has refreshed. The current cache TTL is
900 seconds (15 minutes), with invalidation notifications allowing earlier refresh. This setting
is provisional, not a propagation guarantee.

Before emitting a new action, check registration logs and use an `audit-reader` token to call
`GET /audit/v1/case-service/actions`. Confirm the expected name and version, then submit and
query a controlled event. Do not use a fixed sleep as a readiness check. Configuration-read
failures can appear as missing catalogs or unknown actions; a 404 alone does not prove that
registration is absent.

## Use the REST API

Resolve `urn:ads:platform:audit-service:v1` through the target environment's Directory Service.
The SDK handles discovery automatically. For full schemas, follow the service root's
`_links.docs.href` to its OpenAPI document (`/swagger/docs/v1`).

### Write an event

Use a bearer token with the Audit audience and `audit-writer`. Replace the placeholders with
a UUID and the current ISO 8601 UTC timestamp; preserve both when retrying.
Core callers must also supply the URL-encoded tenant URN as the `tenantId` query parameter.

```http
POST /audit/v1/case-service/events
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "events": [
    {
      "eventId": "{{EVENT_UUID}}",
      "occurredAt": "{{CURRENT_UTC_TIMESTAMP}}",
      "action": "case.update",
      "actionVersion": 1,
      "status": "success",
      "actor": { "id": "onboarding-test-user", "type": "user" },
      "resource": { "type": "case", "id": "onboarding-case-001" },
      "metadata": { "reason": "Onboarding verification" }
    }
  ]
}
```

A confirmed single-event write returns HTTP 202:

```json
{ "accepted": 1, "duplicates": 0, "rejected": [] }
```

**202 alone does not mean every event succeeded.** Check all fields:
`accepted + duplicates + rejected.length` accounts for the submitted events. Rejections include
the zero-based input `index`, `code`, `reason`, and `eventId` when available.

| Constraint | Limit |
| --- | --- |
| Events per request | 1-500 |
| Occurrence time | Previous 7 days through 5 minutes into the future |
| Metadata and change set | 16 KiB UTF-8 JSON each |
| HTTP request body | 20 MiB; enriched batches must also fit the smaller service buffer |
| Action version | Omit to use the current catalog version; an explicit mismatch is rejected |

### Read and export

History reads require `audit-reader` and tenant context. The writer role alone is insufficient.

```http
GET /audit/v1/case-service/events?resourceType=case&resourceId=onboarding-case-001&top=20
Authorization: Bearer {{ACCESS_TOKEN}}
```

Both REST lists and SDK `query()` return `{ results, page }`. Pass `page.next` as `after` for the
next page, keeping the same filters; URL-encode it for REST. Results are newest first.
The detail endpoint uses the returned record's **`id`**, not the caller's `eventId`.
Unlike `record()`, SDK query failures reject the promise.

REST filters include `actor`, `resourceType`, `resourceId`, `action`, `status`, `category`,
`severity`, `scope`, `correlationId`, `sessionId`, `occurredFrom` and `occurredTo`. Filters combine
with AND; time bounds are inclusive. Free-text search is not supported. The SDK's typed criteria
cover a subset; see [SDK types](https://github.com/GovAlta/adsp-monorepo/blob/main/libs/adsp-service-sdk/src/audit/types.ts).
SDK query options also accept another readable `namespace` or an authorized user `token`.

All paths below are relative to `/audit/v1`.

| Method and path | Role | Purpose |
| --- | --- | --- |
| `GET /{namespace}/actions` | `audit-reader` | Effective action definitions. |
| `GET /actions` | `audit-reader` | All effective application catalogs. |
| `GET /retention` | `audit-reader` | Configured retention settings, excluding implicit defaults. |
| `POST /{namespace}/events` | `audit-writer` | Submit a batch of events. |
| `GET /events` | `audit-reader` | History across the tenant's namespaces. |
| `GET /{namespace}/events` | `audit-reader` | History in one namespace. |
| `GET /{namespace}/events/{id}` | `audit-reader` | One stored record. |
| `GET /namespaces` | `audit-reader` | Namespaces with stored events. |
| `GET /events/export` | `audit-reader` | Stream matching events as CSV. |
| `GET /{namespace}/events/export` | `audit-reader` | Stream one namespace's events as CSV. |
| `GET /failed-events` | `audit-admin` | List failed events. |
| `POST /failed-events/{id}/replay` | `audit-admin` | Replay an open failed event; no body required. |

CSV exports use the same filters but ignore `top` and `after`; they are not capped to a page.
Actor name/email columns require `audit-admin` in addition to reader access. An interrupted
export may be incomplete. Removing an action definition does not delete or hide its stored history.

## Retention and administration

Actions reference a retention class, not a number of days. Built-in defaults are **90 days**
for `standard` and **365 days** for `security` and `compliance`; confirm the appropriate policy
for your application.

Settings in `audit-service:retention-<application>` override resolved shared settings in
`audit-service:retention`, which override built-in defaults. Custom classes require a configured
period before use. `RETENTION_MIN_DAYS` and `RETENTION_MAX_DAYS` bound configured periods
(currently 1-3650 days, pending policy confirmation). Missing custom periods or resolved periods
outside the bounds fail writes with 503.

Expiry is calculated from `occurredAt`. Changes apply only to newly enriched events after
configuration refresh; existing stored expiry values are not recalculated.

The **Tenant Management App > Services > Audit** (`audit` feature flag) provides Overview, Logs,
Catalogs and Retention tabs. The Sandbox Audit page also supports controlled writes and failed-event
inspection. Successful history reads are themselves audited; a self-audit failure is logged and
counted but does not fail the read.

Failed-event replay validates the stored event against current configuration, while allowing
events older than seven days. It atomically saves the recovered record, replay status and replay
audit. Invalid data returns 400, an absent row 404, and a non-open row 409. Investigate before replaying.

## Troubleshooting

| Result | What to check or do |
| --- | --- |
| 401 | Token expiry, issuer, environment and Audit audience. Obtain a fresh token after access changes. |
| 403 | Actual caller's role assignment, namespace ownership and target tenant. Provisioning alone does not grant access. |
| 400 / validation rejection | Correct the envelope, action version, timestamp, actor, resource or metadata. |
| Unknown action / catalog 404 | Check catalog publication, active revision, tenant/Core scope, cache visibility and configuration errors. |
| 413 | Reduce the payload or split the batch; enriched events must fit the service buffer too. |
| 429 | Respect `Retry-After`, reduce load and resend the same events with unchanged IDs. |
| 503 / timeout | Check configuration and storage dependencies. Use bounded retries and preserve IDs; delivery may be uncertain. |
| Rejection `storage_failed` | The event was parked in failed-event storage, not normal history. Use the authorized investigation/replay process. |
| SDK `failed` / `buffer_full` | Apply backpressure and durable recovery where required; do not silently discard events. |

Configuration fetch/conversion failures can be indistinguishable from missing configuration and
may cause partial catalogs or fallback settings. An empty role/schema listing from a development
tool is also not proof of missing registration; compare the tenant and Core configuration views.

## Operational notes

- **Rate limits:** per tenant and namespace, counting events rather than requests. Defaults are
  500 events/second and a burst of 500; Core `audit-service:rate-limit` configuration can override
  them within bounds (1-500 events/second, burst 500-1,000). Limits are per pod, not cluster-wide.
  A 429 refuses the whole request; admitted events consume allowance even if later rejected.
- **Storage:** the service batches independently of the SDK (200 events or 200 ms), with a
  per-pod buffer of 1,000 events / 8 MiB. A committed row is required for acceptance.
  Neither buffer provides durable storage during a forced process exit.
- **Health:** `/health/live` checks process responsiveness; `/health/ready` checks database and
  write availability and returns 503 during shutdown. History database queries allow 60 seconds;
  the deployed Route allows 120 seconds. Client deadlines must also allow the intended duration.
- **Retention job:** a separate, single-replica `audit-service-job` runs daily at 02:00 UTC.
  Keep retention disabled in API replicas; drain old API schedulers before starting the job.
  Configure `RETENTION_SCHEDULE`, `RETENTION_BATCH_SIZE` and `RETENTION_MAX_BATCHES` on the job.
  To suspend it, scale the job to zero or change its explicit `RETENTION_ENABLED` setting.
  Cleanup uses stored expiry; missed schedules are not replayed.
- **Database permissions:** the current deployment shares a database account across migrations,
  requests and retention. It does not provide database-enforced append-only isolation.
- **Monitoring:** configure `OTEL_EXPORTER_OTLP_ENDPOINT`. Check
  `audit_failed_events_available = 1`, `audit_failed_events_open`, rate-limit metrics and SDK
  dropped-event metrics. Missing metrics are not a successful zero result.

For implementation and deployment details, see the
[Audit Service source](https://github.com/GovAlta/adsp-monorepo/tree/main/apps/audit-service/src),
[deployment manifest](https://github.com/GovAlta/adsp-monorepo/blob/main/.openshift/managed/audit-service.yml)
and [environment settings](https://github.com/GovAlta/adsp-monorepo/blob/main/.openshift/configuration/audit-service.yml).
