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

### Continuous aggregate backfill

Metric continuous aggregates are created without historical data so that service deployment does not trigger an unbounded database refresh. After deploying the migration, populate each aggregate in windows of no more than 31 days:

```sql
CALL backfill_metric_continuous_aggregate(
  'metrics_daily_continuous',
  '2026-01-01T00:00:00Z',
  '2026-02-01T00:00:00Z'
);
```

Run windows from the oldest metric timestamp forward for each of `metrics_one_minute_continuous`, `metrics_five_minutes_continuous`, `metrics_hourly_continuous`, `metrics_daily_continuous`, `metrics_weekly_continuous`, and `metrics_monthly_continuous`. Completed windows are recorded and skipped when called again:

```sql
SELECT *
FROM metric_continuous_aggregate_backfills
ORDER BY aggregate_name, window_start;
```

Before continuing with the next window, monitor the database load and compare aggregate values against the equivalent `time_bucket` query over `metrics`. Automatic refresh policies keep recent completed buckets current; they do not replace the historical backfill.

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
