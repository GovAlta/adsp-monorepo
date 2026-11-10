---
layout: page
title: Value service
parent: Services
---

# Value service

Value service provides an append only time series data store. It serves as the underlying store for the event log: [event service](event-service.md) writes every logged domain event as a record of a value.

## Client roles

client `urn:ads:platform:value-service`

| name                          | description                                                                                                                                                                                                                                              |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value-reader                  | Reader role for value service. This role is used to allow users to read values and value definitions. It is part of the tenant-admin composite role and allows tenant administrators to read and search the event log.                                   |
| value-writer                  | Writer role for value service. This role is used to allow service accounts to write values to the value service. It also allows users to create, update and delete value definitions, and to read them, since a user with the writer role can also read. |
| value-platform-metrics-reader | Reader role for platform-scoped metrics. Allows core users to read a value's metrics across all tenants. It is not part of the tenant-admin composite role.                                                                                              |

The export service's `urn:ads:platform:export-service:export-job` role can also read values, so that export jobs can read the event log.

## Tenancy

Values, metrics and value definitions belong to a tenant. Every record is stored with the tenant it was written to, and reads only return records of the tenant they act on.

- **Which tenant is used.** Tenant users and service accounts always act on the tenant of their token. Core (platform) users act on the tenant set by the `tenantId` query parameter; writes also accept `tenantId` in the body. An invalid `tenantId` responds 400.
- **Writing values.** Tenant users write to their own tenant; setting a `tenantId` for another tenant responds 403. Core users must set a tenant, otherwise the write responds 400. Event service writes the event log this way, as a core service account.
- **Reading records.** `GET /value/v1/{namespace}/values/{name}` responds 400 for a tenant user without a tenant context. Core users with `value-reader` can leave out `tenantId` to read the records of all tenants.
- **Counts and metrics.** Counting records and reading metrics require a tenant context, so core users must set `tenantId`; without it the request responds 400.
- **Platform metrics.** `GET /value/v1/{namespace}/values/{name}/platform-metrics` is the only endpoint that combines tenants in one response. It needs a core user with `value-platform-metrics-reader`, and labels each interval with its tenant.
- **Latest values of a namespace.** `GET /value/v1/{namespace}/values` acts on the tenant of the caller's token. Core users reading a tenant should read each value with `tenantId` instead.
- **Platform versus tenant definitions.** Value definitions come from the tenant's configuration and from core (platform) configuration. When reading a single definition, a tenant definition takes precedence over a core definition with the same namespace and name. Tenants can't change core definitions through this API, and can't create a definition whose namespace and name are already used by a core definition (409).
- **Isolation.** Records of other tenants are never returned, and definitions of other tenants respond 404.
- **Role scope.** Roles are checked in the tenant being acted on. Core users with the same role are also allowed.

## API overview

All endpoints are under `https://value-service.adsp.alberta.ca/value/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                                   | Purpose                                                      | Required role                                     |
| :--------------------------------------------------------- | :----------------------------------------------------------- | :------------------------------------------------ |
| `POST /value/v1/{namespace}/values/{name}`                 | Write one or more records of a value, with optional metrics. | `value-writer`                                    |
| `GET /value/v1/{namespace}/values/{name}`                  | Read records of a value, newest first, with filters.         | `value-reader`, or export service `export-job`    |
| `GET /value/v1/{namespace}/values/{name}/count`            | Count records of a value.                                    | `value-reader`                                    |
| `GET /value/v1/{namespace}/values`                         | Read the latest record of each defined value in a namespace. | `value-reader`                                    |
| `GET /value/v1/{namespace}/values/{name}/metrics`          | Read interval aggregates of a value's metrics.               | `value-reader`                                    |
| `GET /value/v1/{namespace}/values/{name}/metrics/{metric}` | Read interval aggregates of one metric.                      | `value-reader`                                    |
| `GET /value/v1/{namespace}/values/{name}/platform-metrics` | Read a value's metrics across all tenants.                   | `value-platform-metrics-reader` (core users only) |
| `POST /value/v1/service-metric-rollups/run`                | Run the service metric rollup for completed days.            | `value-writer`                                    |
| `GET /value/v1/definitions`                                | List tenant and core value definitions.                      | `value-reader` or `value-writer`                  |
| `POST /value/v1/definitions`                               | Create a tenant value definition.                            | `value-writer`                                    |
| `GET /value/v1/definitions/{namespace}/{name}`             | Get a value definition (tenant, otherwise core).             | `value-reader` or `value-writer`                  |
| `PATCH /value/v1/definitions/{namespace}/{name}`           | Update a tenant value definition.                            | `value-writer`                                    |
| `DELETE /value/v1/definitions/{namespace}/{name}`          | Delete a tenant value definition.                            | `value-writer`                                    |

The event log has no endpoints of its own in value service. Event log consumers should use the [event service](event-service.md) API, which reads and counts the event log value for them.

## Concepts

### Value

A value represents a particular time series stream, identified by a namespace and name (for example `support` and `application-stats`). Each write results in a new record with a timestamp. It differs from a typical transactional record in that the record has no unique identity; instead it represents another entry in the set of entries for the value. Consumers can write scalars or json objects to values.

A record has a `timestamp` (the time of the write unless set), an optional `correlationId` that links related records, an optional `context` object used to filter reads, and the `value` itself. Writing does not require a value definition. A write can be a full record, a bare JSON object that is written as the value, or an array of either.

### Value definition

Value definition is an optional metadata description for a particular _value_ (identified by a specific namespace and name). The definition provides write-time validation via json schema, and can enable a `value-written` event on each write with `sendWriteEvent`. Records that fail validation are skipped, and the rest of the write goes ahead. Only values with a definition are returned when reading the latest values of a namespace.

Value definitions are managed through the value service definitions API (`/value/v1/definitions`). The value service checks the user's roles and then stores the definitions in the [configuration service](configuration-service.md) under the `platform:value-service` namespace and name, using its own service account. Clients do not need configuration service roles to manage value definitions.

- Reading definitions requires `value-reader` or `value-writer`. Listing returns tenant and core definitions separately; getting a single definition returns the tenant definition if one exists, otherwise the core definition, with `isCore` indicating which.
- Creating, updating and deleting definitions requires `value-writer` and applies to tenant definitions only. Core definitions are read-only through this API.
- The `jsonSchema` of a created or updated definition must be a valid JSON schema, otherwise the request is rejected with a 400.
- Creating a definition adds its namespace if it does not exist, and fails with a 409 if a tenant or core definition with the same namespace and name already exists.
- Deleting the last definition in a namespace removes the namespace.

### Event log

The event log is a value written by [event service](event-service.md): every logged domain event is written as a record of the `event` value in the `event-service` namespace (`/value/v1/event-service/values/event`), to the tenant of the event. The record's `context` holds the event's context plus its `namespace`, `name` and `trace`, and its `value` is `{ payload }`. Event service also writes metrics with each record: `total:count`, `{namespace}:{name}:count`, and, for event definitions with an interval, a `:duration` metric in seconds since the event that started the interval.

> Counting events in the event log is exposed by the [event service](event-service.md#count-events-in-the-event-log).
> Consumers of the event log count should use that API rather than calling value service directly.

Reads of the event log support exact payload searching with either `payloadPath` and `payloadValue`, or a JSON object in
`payload`. Both `timestampMin` and `timestampMax` are required for payload searches, and the two search forms are
mutually exclusive. Every property in a multi-condition `payload` object must match (`AND`). See
[Search the event log](event-service.md#search-the-event-log) for examples and scalar type handling.

### Metrics

Metrics are numeric values that can be included in value writes as a `metrics` object of metric name to number; non-numeric entries are ignored, and metrics are not returned with the record. For a value with a definition, a `metrics` property inside the written `value` object is also moved into the record's metrics. Metrics are aggregated into time intervals (`one_minute`, `five_minutes`, `hourly`, `daily`, `weekly` and `monthly`) with `sum`, `avg`, `min`, `max` and `count` for each interval, and can be used for basic KPIs.

Read a value's metrics from `/value/v1/{namespace}/values/{name}/metrics`, or a single metric from `/value/v1/{namespace}/values/{name}/metrics/{metric}`. The `interval` defaults to `daily`; any value other than the six intervals responds 400. The `criteria` query parameter is a JSON object that accepts `intervalMin`, `intervalMax` and (for all metrics) `metricLike`, and must be valid JSON. Without a range, the last month is read. Results are newest first and paged `top` interval rows at a time (default 100, maximum 5000); pass `page.next` back as `after` for the next page.

Core users with the `value-platform-metrics-reader` role can read a value's metrics across all tenants, labelled by tenant, from `/value/v1/{namespace}/values/{name}/platform-metrics`. This only reads the materialised rollups described below and is not paginated.

### Metric interval rollups

Reading a metric interval aggregates the `metrics` table on every request, which gets slow as history grows. The `metric_interval_rollups` table stores each interval's buckets so those reads become a keyed lookup, and a scheduled job keeps it current.

The job runs every five minutes and moves one interval's coverage by at most a chunk in each direction: forward from where coverage ended, so recent buckets stay fresh, and backward through history, so an interval that has never been rolled up fills in over successive runs. Both windows touch the existing coverage, which keeps `metric_interval_rollup_coverage` a single contiguous span per interval.

Reads consult that coverage. A request whose window falls entirely inside it is served from the rollups; anything reaching outside falls back to a live aggregate of the raw `metrics` table, which is slower but always complete, so rollups can be populated progressively without the API losing data in the meantime.

The end of a requested window is first snapped back to the start of the interval in progress, so only whole periods are ever served: a `monthly` request made on 17 September returns August as its most recent bucket rather than seventeen days of September, and the bound actually used comes back as `page.intervalMax` so a shortened window is distinguishable from one that simply holds no data. Snapping is what lets coverage satisfy a request reaching up to "now" — a composed interval's rollup can never contain its own open bucket, so without it every such read missed on the trailing edge and fell back to a live aggregate of the whole window.

Each interval is aggregated from the next finer one, and only `one_minute` reads the raw `metrics` table. `sum`, `count`, `min` and `max` all compose — a month's sum is the sum of its days' sums, its min the least of their mins — so a monthly bucket is built from about thirty daily rows rather than a month of raw metrics. That is why the rollups store those four and derive the average on read: an average of averages would not compose. Both `weekly` and `monthly` build from `daily`, because a week can straddle a month boundary and so does not nest inside one.

An interval can only advance as far as its source has been rolled up, so coverage fills from the finest interval outwards and a coarse interval waits, logging at debug, until its source has something to build from.

`METRIC_INTERVAL_ROLLUP_MAX_CHUNK_HOURS` caps every interval's window, and defaults to a week. It cannot cut a window below a single bucket, since an interval whose chunk is narrower than its bucket would never finish backfilling. A composed interval's read cost follows the number of rollup rows rather than the span of time it covers, but what it writes does not: the upsert groups by namespace, name, tenant and metric as well as the bucket, so a wide window can still write one row per bucket per distinct series in a single statement — enough, on a tenant-heavy deployment, to exhaust the database's shared lock table even though no relation the query touches is itself large. Capping every interval's window keeps that upsert bounded the same way it keeps `one_minute`'s raw scan bounded.

Intervals advance one at a time, each in its own transaction under a Postgres advisory lock, so of the replicas that all schedule the job, whichever gets the lock advances that interval and the rest skip it; within a replica, a tick arriving while the last run is still going is skipped as well. Committing per interval is what keeps the job making progress: an interval that exceeds `METRIC_INTERVAL_ROLLUP_STATEMENT_TIMEOUT_MS` rolls back only itself and is logged by name, while the intervals that already succeeded stay committed. `DB_POOL_MAX` bounds how many connections a replica can hold at all — worth setting deliberately, since it is multiplied by the replica count against one database.

Coverage is recorded in whole buckets: both edges are snapped down to a bucket boundary, so the bucket currently being written to is never advertised as rolled up. Reads of a window that includes it fall back to the `metrics_*` views, which is what keeps a partially totalled bucket from being served as a complete one.

Set `METRIC_INTERVAL_ROLLUP_JOB_ENABLED=false` to stop the job. Reads keep working — they fall back to the views — but the rollups stop advancing and stale coverage will gradually stop matching incoming requests.

```sql
SELECT "interval", covered_from, covered_to, updated_at
FROM metric_interval_rollup_coverage
ORDER BY "interval";
```

Rollups store `sum` and `count` rather than an average, because an average of averages is not the average; the read path divides the two.

### Service metric rollups

A daily job summarises tenant activity for `pdf-service`, `form-service` and `notification-service` into the `service_metric_rollups` table: one row per day, tenant and service, with counts of initiated, succeeded and failed operations, duration totals, and the number of distinct resources (for example PDF templates or form definitions). The rows are derived from the event log and the services' metrics.

The job is off by default. Set `SERVICE_METRIC_ROLLUP_JOB_ENABLED=true` to run it daily at 02:00, recomputing the last `SERVICE_METRIC_ROLLUP_TRAILING_DAYS` completed days (default 3). Set `SERVICE_METRIC_ROLLUP_BACKFILL_ON_STARTUP=true` to roll up the full history once when the table is empty.

A rollup can also be run on demand with `POST /value/v1/service-metric-rollups/run` and the `value-writer` role. The body can set `start` and `end` dates, which default to the trailing days. Core users can set `tenantId` or leave it out to roll up all tenants; tenant users always roll up their own tenant. The current partial day and future days are rejected.

## Events

Value service sends one domain event:

| Event           | Sent when                                                                                                                                                                                             |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value-written` | A record is written to a value whose definition has `sendWriteEvent` set. The payload has `timestamp`, `value` and `writtenBy`, and the context has the record's context plus `namespace` and `name`. |

`value-written` events are not written to the event log. Value service doesn't consume domain events; event service writes the event log by calling the value service API, not through an event subscription.

## Audit

Value service records audit events for administrative changes through the [audit service](audit-service.md), under the `value-service` namespace. Each record includes the actor and the affected resource. Actions do not set a retention class; the audit service derives it from the category (`compliance` for administrative and data-access actions, `standard` for runtime actions), as shown in the table.

| Action | Category | Severity | Retention | Recorded when |
|---|---|---|---|---|
| `value-definition.created` | administrative | info | compliance | A value definition is created. |
| `value-definition.updated` | administrative | info | compliance | A definition is updated; metadata lists the changed fields. |
| `value-definition.deleted` | administrative | warning | compliance | A value definition is deleted. |
| `value-definition.service-metric-rollup.triggered` | runtime | info | standard | A rollup is triggered manually via the API. A rollup across all tenants records one event per tenant rolled up. |

Value writes, the scheduled rollup job and read operations are not audited. Set `VALUE_AUDIT_ENABLED=false` to disable audit recording for the service; when unset, the SDK `AUDIT_ENABLED` setting applies (enabled by default).

## Code examples

### Write a value

```typescript
const namespace = 'support';
const name = 'application-stats';
const value = {
  correlationId,
  context,
  timestamp: new Date(),
  value: {
    property: 123,
  },
  metrics: {
    'applications:count': 1,
  },
};

const response = await fetch(`https://value-service.adsp.alberta.ca/value/v1/${namespace}/values/${name}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(value),
});

const { correlationId, context, timestamp, value } = await response.json();
```

### Read a value

Records are returned newest first, `top` at a time (default 10, maximum 5000). Pass `page.next` back as `after` to read the next set. Set `order=asc` to read oldest first instead; this reaches the oldest end of a large result set without paging past all of the newer records.

```typescript
const namespace = 'support';
const name = 'application-stats';
const response = await fetch(`https://value-service.adsp.alberta.ca/value/v1/${namespace}/values/${name}`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Records are keyed by namespace, then name.
const { page, ...result } = await response.json();
const records = result[namespace][name];
```

### Read the latest values of a namespace

```typescript
const namespace = 'support';
const response = await fetch(
  `https://value-service.adsp.alberta.ca/value/v1/${namespace}/values?names=application-stats`,
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

// Keyed by namespace, then name; each is the latest record.
const { [namespace]: latest } = await response.json();
const { timestamp, value } = latest['application-stats'];
```

### Count records

```typescript
const namespace = 'support';
const name = 'application-stats';
const response = await fetch(
  `https://value-service.adsp.alberta.ca/value/v1/${namespace}/values/${name}/count?timestampMin=2026-09-01T00:00:00Z`,
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

const { count } = await response.json();
```

### Read metrics

```typescript
const namespace = 'support';
const name = 'application-stats';
const criteria = { intervalMin: '2026-09-01T00:00:00Z', intervalMax: '2026-10-01T00:00:00Z' };
const response = await fetch(
  `https://value-service.adsp.alberta.ca/value/v1/${namespace}/values/${name}/metrics?interval=daily&criteria=${encodeURIComponent(JSON.stringify(criteria))}`,
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

// Keyed by metric name; each has values of { interval, sum, avg, min, max, count }, newest first.
// page.intervalMax is the end of the window actually read.
const { page, ...metrics } = await response.json();
```

### Create a value definition

```typescript
const response = await fetch('https://value-service.adsp.alberta.ca/value/v1/definitions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    namespace: 'support',
    name: 'application-stats',
    description: 'Statistics for support applications.',
    jsonSchema: {
      type: 'object',
      properties: { property: { type: 'number' } },
    },
    sendWriteEvent: false,
  }),
});

const { namespace, name, jsonSchema, isCore } = await response.json();
```

### Read value definitions

```typescript
const response = await fetch('https://value-service.adsp.alberta.ca/value/v1/definitions', {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Each is a map of namespace name to { name, definitions }.
const { tenant, core } = await response.json();
```

### Update a value definition

Properties not included in the request are left unchanged.

```typescript
const namespace = 'support';
const name = 'application-stats';
const response = await fetch(`https://value-service.adsp.alberta.ca/value/v1/definitions/${namespace}/${name}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ description: 'Updated statistics for support applications.' }),
});
```

### Delete a value definition

```typescript
const namespace = 'support';
const name = 'application-stats';
const response = await fetch(`https://value-service.adsp.alberta.ca/value/v1/definitions/${namespace}/${name}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { deleted } = await response.json();
```
