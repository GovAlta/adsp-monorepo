---
layout: page
title: Value service
nav_order: 6
parent: Services
---

# Value service

Value service provides an append only time series data store. It serves as the underlying store for the event log.

## Client roles

client `urn:ads:platform:value-service`

| name         | description                                                                                                                                                                                                      |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value-reader | Reader role for value service. This role is used to allow users to read values from the values. It is part of the tenant-admin composite role and allows tenant administrators to read and search the event log. |
| value-writer | Writer role for value service. This role is used to allow service accounts to write values to the value service.                                                                                                 |

## Concepts

### Value definition

Value definition is an optional metadata description for a particular _value_ (identified by a specific namespace and name). The definition provides write-time validation via json schema. Value definitions are configured in the [configuration service](configuration-service.md) under the `platform:value-service` namespace and name.

### Value

A value represents a particular time series stream. Each write results in a new record with a timestamp. It differs from a typical transactional record in that the record has no unique identity; instead it represents another entry in the set of entries for the value. Consumers can write scalars or json objects to values.

### Metrics

Metrics are numeric values that can be included in value writes. The are automatically included in time interval aggregations and can be used for basic KPIs.

### Metric interval rollups

Reading a metric interval aggregates the `metrics` table on every request, which gets slow as history grows. The `metric_interval_rollups` table stores each interval's buckets so those reads become a keyed lookup, and a scheduled job keeps it current.

The job runs every five minutes and moves one interval's coverage by at most a chunk in each direction: forward from where coverage ended, so recent buckets stay fresh, and backward through history, so an interval that has never been rolled up fills in over successive runs. Both windows touch the existing coverage, which keeps `metric_interval_rollup_coverage` a single contiguous span per interval.

Reads consult that coverage. A request whose window falls entirely inside it is served from the rollups; anything reaching outside falls back to the `metrics_*` view, which aggregates on read and is always complete. Rollups can therefore be populated progressively without the API losing data in the meantime.

A refresh reads the raw `metrics` table over its window, so what a run costs follows the span of that window rather than the width of the bucket being filled — a month of metrics is the same read whether it lands in daily buckets or one monthly bucket. `METRIC_INTERVAL_ROLLUP_MAX_CHUNK_HOURS` caps that span, defaulting to a week; it cannot cut a window below a single bucket, since an interval whose chunk is narrower than its bucket would never finish backfilling. Lower it where the table is large enough that a week is too much to read at once, at the cost of history filling in more slowly.

Only one run happens at a time. The job takes a Postgres advisory lock for the run, so of the replicas that all schedule it, whichever gets the lock does the work and the rest skip that tick; within a replica, a tick arriving while the last run is still going is skipped as well. `METRIC_INTERVAL_ROLLUP_STATEMENT_TIMEOUT_MS` bounds how long a single refresh may hold its connection, and `DB_POOL_MAX` bounds how many connections a replica can hold at all — worth setting deliberately, since it is multiplied by the replica count against one database.

Set `METRIC_INTERVAL_ROLLUP_JOB_ENABLED=false` to stop the job. Reads keep working — they fall back to the views — but the rollups stop advancing and stale coverage will gradually stop matching incoming requests.

```sql
SELECT "interval", covered_from, covered_to, updated_at
FROM metric_interval_rollup_coverage
ORDER BY "interval";
```

Rollups store `sum` and `count` rather than an average, because an average of averages is not the average; the read path divides the two.

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

```typescript
const namespace = 'support';
const name = 'application-stats';
const response = await fetch(`https://value-service.adsp.alberta.ca/value/v1/${namespace}/values/${name}`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { results, page } = await response.json();
```
