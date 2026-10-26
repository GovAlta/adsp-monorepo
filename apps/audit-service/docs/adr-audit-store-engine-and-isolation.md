# ADR-XXXX: Audit store engine, retention and tenant isolation

- Status: **Proposed** (from spike OSP-694).
- Related: OSP-694, OSP-693 (database access and roles)

## Context

The design document asks for:

- PostgreSQL for `audit_events`
- retention by batched `DELETE`
- row-level security (RLS) using `current_setting('app.tenant_id', true)`

Facts in the platform today:

- `value-service` uses TimescaleDB.
- No ADSP service uses RLS. `AGENTS.md` says isolation is at the record level.
- `audit-service` already runs on plain PostgreSQL (knex).
- It has a unique index on `(tenant_id, namespace, event_id)` and a per-row `retention_until`.
- The database instance is in `adsp-dev` (secret `audit-service-postgres`).

## Decision 1: Use plain PostgreSQL (proposed)

- `audit_events` is a normal table. No Timescale.
- Why:
  - A hypertable needs `occurred_at` in every unique index. Event-id uniqueness would be lost.
  - Retention is per row, and chunk deletion can't do that.
  - Measured speed is good enough (see Evidence).
- Result: no Timescale instance and no `${APP_NAME}-timescaledb` secret needed.

## Decision 2: Delete expired rows one batch at a time (proposed)

- Run `DELETE ... WHERE retention_until < now()` in batches, using the `audit_retention` role.
- Do **not** add `drop_chunks` later as a speed-up (note for task 11.2). A chunk can hold events with different retention. Dropping it would delete events that must still be kept.
- Status: the job is not built yet. Only the grant and the `retention_until` index exist.

## Decision 3: No RLS for now (proposed, platform team to confirm)

- Tenant isolation stays in application code, like the other ADSP services.
- Why:
  - RLS would be a second isolation method that only this service has.
  - Every request would need a transaction with `SET LOCAL`.
  - The cross-tenant write buffer would need a redesign.
- Planned safety steps (after the MVP, not done yet):
  - Run the service as the `audit_app` role.
  - Add a test that every query is limited to one tenant.

## Evidence

Local Postgres 16, 2 CPU / 2 GB, 1M made-up rows, the real audit-service migrations.

| Measure                                                                                                      | Result                         |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 200-event batch insert, empty table                                                                          | median 18 ms, p95 32 ms        |
| 200-event batch insert, 1M rows                                                                              | median 22 ms, p95 23 ms        |
| Default listing (tenant + namespace, top 50)                                                                 | ~1.1 ms                        |
| Cross-namespace listing (top 50)                                                                             | ~1.7 ms                        |
| Cross-namespace listing, offset 10,000 (the API now uses a keyset cursor, so deep pages no longer cost more) | ~7.4 ms                        |
| Batched delete (5k rows per batch)                                                                           | 534k rows in 9 s (~60k rows/s) |

RLS test (477k rows, measured after the delete test, so the baselines differ from the rows above):

| Query                          | Without RLS | With RLS + `SET LOCAL` |
| ------------------------------ | ----------- | ---------------------- |
| Default listing                | 2.0 ms      | 6.6 ms                 |
| Cross-namespace listing        | 3.2 ms      | 7.5 ms                 |
| Cross-namespace, offset 10,000 | 9.8 ms      | 16.8 ms                |

About 3.3 ms of the extra time is the transaction round trip.

Other RLS results:

- Tenant not set: 0 rows visible.
- Plain `SET` on a pooled connection: **leaks** (23,912 rows visible).
- `SET LOCAL`: does not leak.
- Insert for another tenant: rejected.

Limits of the tests:

- Local container, not the platform instance.
- Made-up data: 20 tenants, 3 years, 53% of rows expired in the delete test.

Appendix B needs no change, because the implementation uses the same eight indexes.
## Open Items

- The service uses one database user for migrations and requests (`src/postgres/index.ts`). The default `DB_USER` is `audit_owner`. That user owns the tables, so the append-only grants are not enforced at runtime.
- The DBA has not created `audit_app` and `audit_retention` in dev, and they are not in the MVP. The migrations skip missing roles and do not run again. Once the roles exist, the DBA must apply:
  - `INSERT, SELECT` on `audit_events` and `audit_failed_events` to `audit_app`
  - `UPDATE (status, replayed_as)` on `audit_failed_events` to `audit_app`
  - `SELECT, DELETE` on `audit_events` to `audit_retention`
