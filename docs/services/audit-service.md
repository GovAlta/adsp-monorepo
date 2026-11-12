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

## Client roles

These client roles belong to `urn:ads:platform:audit-service` and are registered by the service on startup:

| Role           | Permission                                                                                                                                           | Included in `tenant-admin`   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `audit-reader` | Read action catalogs, retention settings and audit history, and export history as CSV.                                                               | Yes, after provisioning.     |
| `audit-writer` | Submit audit events. Assign to application service accounts.                                                                                         | No; assign explicitly.       |
| `audit-admin`  | Add actions to a tenant catalog, list and replay failed events, and include actor name and email in CSV exports (which also require `audit-reader`). | No; assign only when needed. |

`audit-admin` does not replace reader or writer permissions. Each role grants access when it is held in the
caller's tenant, or as a Core role.

### Grant access to an application

Start with the [Node.js SDK service-account setup](../platform/platform-node-sdk.md#setting-up-a-service-account).
Use an SDK release that includes `auditActions`, `auditService.record()` and `auditService.query()`.
Keep client secrets in approved secret storage, never in source code.

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

## Tenancy

Audit data is isolated by tenant: every stored event, failed event and tenant catalog belongs to one tenant.

- **Tenant callers** always act on the tenant of their token. Setting the `tenantId` query parameter to any other
  tenant responds 403; a value that is not a tenant URN (`urn:ads:platform:tenant-service:v2:/tenants/<id>`)
  responds 400.
- **Core callers** select the tenant with `tenantId`. It is required to write events (400 without it), to read,
  list namespaces or export history (403 without it), to add actions (400) and to administer failed events (400).
  Without it, `GET /actions` and `GET /{namespace}/actions` return only Core catalogs and `GET /retention` returns
  empty settings.
- **Namespace ownership.** A tenant writer can write only to the namespace that matches the service part of its
  verified client ID (`azp`), for example `case-service` for `urn:ads:case-team:case-service`. Core writers may
  write to any namespace. Readers can read every namespace in their tenant.
- **Platform versus tenant catalogs.** Action catalogs and retention settings are merged from Core and the tenant.
  For actions, Core wins on duplicate names and tenants cannot add actions to a Core namespace. For retention, the
  tenant's `retention` settings override built-in defaults, and `retention-<application>` overrides both.
- **Isolation.** An event or failed-event ID from another tenant responds 404, not 403.

## API overview

All endpoints are under `https://audit-service.adsp.alberta.ca/audit/v1`; resolve
`urn:ads:platform:audit-service:v1` through the Directory Service to get the URL for other environments. See the
[API documentation](https://api.adsp.alberta.ca) for request and response schemas; each environment also serves
its OpenAPI document at the service root's `_links.docs.href` (`/swagger/docs/v1`).

| Endpoint                                   | Purpose                                                | Required role  |
| :----------------------------------------- | :----------------------------------------------------- | :------------- |
| `GET /audit/v1/actions`                    | List all action catalogs visible to the tenant.        | `audit-reader` |
| `GET /audit/v1/{namespace}/actions`        | List a namespace's effective action definitions.       | `audit-reader` |
| `POST /audit/v1/{namespace}/actions`       | Add an action to the tenant's catalog for a namespace. | `audit-admin`  |
| `GET /audit/v1/retention`                  | Read configured retention settings, without defaults.  | `audit-reader` |
| `POST /audit/v1/{namespace}/events`        | Submit a batch of 1 to 500 events.                     | `audit-writer` |
| `GET /audit/v1/events`                     | Read history across the tenant's namespaces.           | `audit-reader` |
| `GET /audit/v1/{namespace}/events`         | Read history in one namespace.                         | `audit-reader` |
| `GET /audit/v1/{namespace}/events/{id}`    | Read one stored event.                                 | `audit-reader` |
| `GET /audit/v1/namespaces`                 | List namespaces with stored events.                    | `audit-reader` |
| `GET /audit/v1/events/export`              | Stream matching events as CSV.                         | `audit-reader` |
| `GET /audit/v1/{namespace}/events/export`  | Stream one namespace's events as CSV.                  | `audit-reader` |
| `GET /audit/v1/failed-events`              | List failed (parked) events.                           | `audit-admin`  |
| `POST /audit/v1/failed-events/{id}/replay` | Replay an open failed event; no body required.         | `audit-admin`  |

Retention settings, application retention overrides and Core rate limits are configuration: change them through
the [configuration service](configuration-service.md) in the `audit-service` namespace. The audit service has no
endpoints of its own for writing them. The probes `/health`, `/health/live` and `/health/ready` are not part of
the API documentation.

## Concepts

| Identifier            | Example                              | Purpose                                                      |
| --------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Application client ID | `urn:ads:case-team:case-service`     | Keycloak client and SDK `serviceId`.                         |
| Audit namespace       | `case-service`                       | The service component of the client ID: `serviceId.service`. |
| Audit Service client  | `urn:ads:platform:audit-service`     | Owns the Audit roles and required token audience.            |
| API discovery ID      | `urn:ads:platform:audit-service:v1`  | Resolves the environment's Audit API URL.                    |
| Action catalog        | `audit-service:actions-case-service` | Configuration namespace and document name.                   |

### Namespace

A namespace groups the events of one application. It is the service part of the writer's client ID, and must be
lowercase kebab-case, at most 40 characters.

### Action catalog

An action catalog lists the actions an application can record, each with a `version`, `category`, `severity` and
optional retention class, resource type, metadata schema and change-set capture. Catalogs live in the
configuration service as `audit-service:actions-<application>`, registered by Core or by a tenant. Registering an
action does not create an audit record. See [Register and publish actions](#register-and-publish-actions).

### Audit event

An event records that an actor performed an action, with an outcome `status`, on an optional resource. The writer
supplies the `eventId` (a UUID, unique per tenant and namespace, so a resend is a duplicate rather than a second
record) and `occurredAt`. The service sets the tenant, namespace, `writtenBy`, `receivedAt`, category, severity,
retention class and expiry, and assigns the `id` used to read the event back. The API never changes a stored
event; the retention job deletes it after `retentionUntil`.

### Retention class

Actions name a retention class rather than a period. The class's period, resolved when the event is written,
fixes the event's `retentionUntil`. See [Retention and administration](#retention-and-administration).

### Failed event

When storage fails after an event is accepted for writing, the event is parked in failed-event storage and the
write reports it as rejected with code `storage_failed`. An `audit-admin` can list parked events and replay an open
one, which stores it as a normal event.

## Events

The audit service doesn't send or consume domain events. Audit events are a separate concept: they are stored
records, not messages.

The service records its own sensitive operations as audit events in the `audit-service` namespace: history reads
(`events.list`, `events.list-all`, `events.read`), exports (`events.export`), failed-event listing
(`failed-events.list`) and replays (`failed-event.replay`). Read them like any other namespace.

## Code examples

The examples use `fetch` with a bearer token for a client that has the Audit audience and the role named in each
example. Core callers also add `tenantId` with the tenant URN to each request.

### Add an action

Requires `audit-admin`. The caller's token is forwarded to the configuration service, so configuration write
permission is required as well.

```typescript
const response = await fetch('https://audit-service.adsp.alberta.ca/audit/v1/case-service/actions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'case.update',
    version: 1,
    category: 'administrative',
    severity: 'info',
    resourceType: 'case',
  }),
});

// 201 with the added definition; 409 if the name already exists.
const { name, version } = await response.json();
```

The action is added to the caller's tenant catalog (`actions-<namespace>`, created if missing). The name is
compared in full and case-insensitively with the namespace's own catalog, read directly from the configuration
service rather than the cache. Names in other namespaces, including Core ones, do not conflict. `409` is returned
when the name already exists in the namespace, or when the namespace is itself a Core namespace; `503` when the
check cannot be made, in which case nothing is written.

### Write events

Requires `audit-writer`. Generate the `eventId` and `occurredAt` once and preserve both when retrying.

```typescript
const response = await fetch('https://audit-service.adsp.alberta.ca/audit/v1/case-service/events', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    events: [
      {
        eventId: crypto.randomUUID(),
        occurredAt: new Date().toISOString(),
        action: 'case.update',
        actionVersion: 1,
        status: 'success',
        actor: { id: 'test.user@gov.ab.ca', type: 'user' },
        resource: { type: 'case', id: 'case-001' },
        metadata: { reason: 'Address updated' },
      },
    ],
  }),
});

// 202: { accepted: 1, duplicates: 0, rejected: [] }
const { accepted, duplicates, rejected } = await response.json();
```

**202 alone does not mean every event succeeded.** Check all fields:
`accepted + duplicates + rejected.length` accounts for the submitted events. Rejections include
the zero-based input `index`, `code`, `reason`, and `eventId` when available.

| Constraint              | Limit                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| Events per request      | 1-500                                                                     |
| Occurrence time         | Previous 7 days through 5 minutes into the future                         |
| Metadata and change set | 16 KiB UTF-8 JSON each                                                    |
| HTTP request body       | 20 MiB; enriched batches must also fit the smaller service buffer         |
| Action version          | Omit to use the current catalog version; an explicit mismatch is rejected |

### Read history

Requires `audit-reader`. The writer role alone is insufficient.

```typescript
const params = new URLSearchParams({ resourceType: 'case', resourceId: 'case-001', top: '20' });
const response = await fetch(`https://audit-service.adsp.alberta.ca/audit/v1/case-service/events?${params}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { results, page } = await response.json();
for (const { id, action, occurredAt, actor } of results) {
  console.log(id, action, occurredAt, actor.id);
}
// Pass page.next as `after`, with the same filters, for the next page.
```

Both REST lists and SDK `query()` return `{ results, page }`. Results are newest first.
The detail endpoint (`GET /audit/v1/{namespace}/events/{id}`) uses the returned record's **`id`**, not the
caller's `eventId`. Unlike `record()`, SDK query failures reject the promise.

REST filters include `actor`, `resourceType`, `resourceId`, `action`, `status`, `category`,
`severity`, `scope`, `correlationId`, `sessionId`, `occurredFrom` and `occurredTo`. Filters combine
with AND; time bounds are inclusive. Free-text search is not supported. The SDK's typed criteria
cover a subset; see [SDK types](https://github.com/GovAlta/adsp-monorepo/blob/main/libs/adsp-service-sdk/src/audit/types.ts).
SDK query options also accept another readable `namespace` or an authorized user `token`.

### Export history as CSV

Requires `audit-reader`.

```typescript
const params = new URLSearchParams({ occurredFrom: '2026-11-01T00:00:00Z' });
const response = await fetch(`https://audit-service.adsp.alberta.ca/audit/v1/events/export?${params}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

const csv = await response.text();
```

CSV exports use the same filters but ignore `top` and `after`; they are not capped to a page.
Actor name/email columns require `audit-admin` in addition to reader access. An interrupted
export may be incomplete. Removing an action definition does not delete or hide its stored history.

### Replay a failed event

Requires `audit-admin`. List the failed events, then replay an open one by its `id`.

```typescript
const headers = { Authorization: `Bearer ${accessToken}` };
const list = await fetch('https://audit-service.adsp.alberta.ca/audit/v1/failed-events?top=20', { headers });
const { results } = await list.json();

const open = results.find(({ status }) => status === 'open');
const replay = await fetch(`https://audit-service.adsp.alberta.ca/audit/v1/failed-events/${open.id}/replay`, {
  method: 'POST',
  headers,
});

// 200 with status 'replayed' and replayed_as set to the stored event's id.
const { status, replayed_as } = await replay.json();
```

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

#### Record another application's events

A Core service that bridges events from another application, such as Keycloak events forwarded
for the access service, can record them in that application's namespace. Create a separate client
with `createAuditService`; the namespace is the `service` part of `serviceId`. `auditActions` only
registers the caller's own catalog, so register the bridged application's catalog through the
`serviceConfigurations` initialization option, using the `actions-<application>` document shown in
**Register without the SDK** below.

```typescript
import { adspId, createAuditService } from '@abgov/adsp-service-sdk';

const accessAudit = createAuditService({
  isCore: true,
  logger,
  directory,
  tokenProvider,
  serviceId: adspId`urn:ads:platform:access-service`,
  meterProvider,
});

await accessAudit.record(USER_DELETED, { tenantId, actor, resource });
```

The client writes as a Core writer, so every record needs an explicit `tenantId` taken from the
bridged event. `writtenBy` is still the calling service's client (for example
`urn:ads:platform:event-service`), which needs the `audit-writer` role.

### Record from an authenticated request

In an Express handler behind SDK authentication, `auditDetailsFromRequest(req, details)` sets
`actor` from `req.user` and `tenantId` from `req.tenant` (or the user's tenant). Values passed in
`details` take precedence; for example, a Core service acting on a different tenant passes that
tenant's `tenantId`. `toAuditActor(user)` converts a user on its own: Keycloak service accounts
(`service-account-*`) become `service` actors, other users `user` actors. Both throw when there is
no user and no explicit actor, so events are never attributed to an unknown actor.

```typescript
import { auditDetailsFromRequest, toAuditActor } from '@abgov/adsp-service-sdk';

router.patch('/cases/:id', async (req, res, next) => {
  try {
    const updated = await updateCase(req.params.id, req.body);

    // The SDK logs any event that is not recorded; no outcome handling is needed here.
    await auditService.record(
      ACTIONS.UPDATE_CASE,
      auditDetailsFromRequest(req, {
        resource: { type: 'case', id: updated.id },
        metadata: { reason: req.body.reason },
      }),
    );

    res.send(updated);
  } catch (err) {
    next(err);
  }
});

// Outside a request, for example in a queue consumer:
await auditService.record(ACTIONS.UPDATE_CASE, { tenantId, actor: toAuditActor(user), resource });
```

When the operation must not succeed without its audit record, check the outcome and fail the
request instead:

```typescript
router.post('/cases/:id/close', async (req, res, next) => {
  try {
    const closed = await closeCase(req.params.id);

    const outcome = await auditService.record(
      ACTIONS.UPDATE_CASE,
      auditDetailsFromRequest(req, {
        resource: { type: 'case', id: closed.id },
        metadata: { reason: 'Case closed' },
      }),
    );
    if (outcome.status !== 'recorded') {
      throw new Error(`Audit event ${outcome.eventId} was not recorded.`);
    }

    res.send(closed);
  } catch (err) {
    next(err);
  }
});
```

### Event content and delivery

`record()` supplies a UUID `eventId`, the current `occurredAt`, and business `status: 'success'`
when omitted. Supply these explicitly when preserving an event for later delivery. Business
status can be `success`, `failure`, `blocked` or `error`; it is separate from the delivery outcome.

To capture changes, set `captureChangeSet: true` on the action and add
`changeSet: { before: { state: 'draft' }, after: { state: 'submitted' } }` to the record details.
Otherwise the SDK drops the change set before sending. Record only necessary data; never include
credentials or unnecessary personal information.

`record()` never rejects. The SDK logs every event that is not recorded, with its action, event ID
and tenant: rejections and local failures at `warn`, delivery failures at `error`. Inspect the
outcome only when the operation needs a different policy, such as failing the request or resending
with the same `eventId`.

| Outcome | Meaning | Response |
| --- | --- | --- |
| `recorded` | A committed audit row or an existing idempotent duplicate was confirmed. | Continue. |
| `rejected` | The service returned a per-event `code` and `reason`, or recording is turned off (`code: 'audit_disabled'`) and nothing was sent. | Investigate; the SDK does not resubmit it automatically. |
| `failed` | Delivery failed or could not be confirmed; includes `reason` and `error`. | Apply an explicit recovery policy; the event may already be stored. |

### Turn audit recording off

Audit recording is on by default. Set the environment variable `AUDIT_ENABLED=false` (or `0`) to
turn it off for every SDK audit client in the process, including clients from `createAuditService`.
Each `record()` then resolves `{ status: 'rejected', eventId, code: 'audit_disabled', reason }`
without contacting Audit Service, and the event is not counted as dropped. Any other value, or no
value, leaves recording on. To decide in code instead, pass `audit: { enabled: false }` to either
initializer or `enabled: false` to `createAuditService`; the option takes precedence over the
variable. Action catalogs are still registered and `query()` still works, so turning recording back
on needs only a restart.

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
`security`, `data-access`, `diagnostic`) and `severity` (`info`, `warning`, `critical`). Optional
fields include `retentionClass`, `description`, `resourceType`, `metadataSchema`,
`captureChangeSet` and `forwardToSiem`. Both flags default to false; SIEM forwarding is a separate
capability. Shared Core definitions win over tenant definitions with the same action name.

When `retentionClass` (a kebab-case name, never a duration) is omitted, it is derived from the
category: `administrative` and `data-access` use `compliance`, `security` uses `security`, and
`runtime` and `diagnostic` use `standard`. A `retentionClass` set on the action overrides the
category default, including custom classes. The class is resolved when the event is written and
stored on the event.

The `diagnostic` category is for debugging-oriented records (as opposed to audit records of who did
what). Applications register diagnostic actions in their own catalog like any other category, and
the events are filterable with `category=diagnostic` when reading or exporting.

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
