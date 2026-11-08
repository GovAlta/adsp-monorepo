# adsp-service-sdk

SDK for Alberta Digital Service Platform (ADSP).

Use this library to build Node based platform and tenant services for ADSP.

## Getting started

Initialize the SDK for either platform or tenant service.

```typescript
  import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const {
    coreStrategy,
    tenantStrategy,
    ...sdkCapabilities,
  } = await initializePlatform(
    {
      displayName: 'My platform service',
      description: 'Example of a platform service.',
      serviceId,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      clientSecret: environment.CLIENT_SECRET,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      configurationSchema,
      events: [],
      roles: [],
      notifications: [],
    },
    { logger }
  );
```

See [ADSP Development Guide](https://govalta.github.io/adsp-monorepo) for details.

## Audit action classifications

Use the shared constants when defining audit actions:

```typescript
import {
  AuditAction,
  AuditCategories,
  AuditSeverities,
  BuiltInRetentionClasses,
} from '@abgov/adsp-service-sdk';

const UPDATE_CASE: AuditAction = {
  name: 'case.update',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
};
```

`AuditCategory` and `AuditSeverity` are string unions derived from the constants, so existing
string literals and serialized catalog values remain compatible. `retentionClass` remains a
string: applications may use custom class names such as `case-history` when a corresponding
retention period is configured. Built-in class constants specify names, not retention periods.

## Audit service client

Register actions with `auditActions` and record events with the returned `auditService`:

```typescript
const { auditService } = await initializeService(
  { serviceId, displayName: 'Case service', description: 'Case management', auditActions: [UPDATE_CASE] },
  { logger },
);

const outcome = await auditService.record(UPDATE_CASE, { actor: { id: user.id, type: 'user' } });
if (outcome.status !== 'recorded') {
  logger.warn(`Audit event ${outcome.eventId} was not recorded: ${outcome.reason}`);
}
```

By default, each event is sent immediately in its own HTTP request. Await `record()` and check its
outcome: it never rejects, and `recorded` means the service confirmed storage or an idempotent
duplicate, not just receipt in an in-memory queue. Once all calls have settled, no separate audit
`flush()` is needed. Normal application shutdown must still wait for in-flight requests and tasks.
Sending immediately does not make fire-and-forget calls safe against process termination.

For high-throughput workloads, opt into client-side batching through the `audit` option on either
`initializeService` or `initializePlatform`:

```typescript
const { auditService } = await initializeService(
  {
    ...serviceOptions,
    auditActions: [UPDATE_CASE],
    audit: { batchSize: 100, batchIntervalMs: 500 },
  },
  { logger },
);
```

Batching is enabled by setting `batchSize` greater than 1; partial batches wait up to
`batchIntervalMs` (500 ms by default). Before shutdown, call `await auditService.flush()` if batches
or unawaited records remain. This configuration preserves the previous 100-event / 500-ms behavior;
the new default increases HTTP request volume. Audit Service still batches database writes on the
server, independently of client batching.

Both modes retain bounded in-flight/retry memory, transient retries with the same `eventId`, and
the `audit.client.dropped_events` metric. A failed delivery may already have been stored if its
response was lost; resend with the same `eventId`. `AuditClientOptions` is exported for typed
configuration, including request timeouts and retry delays. See the
[Audit service documentation](https://govalta.github.io/adsp-monorepo/services/audit-service.html).
