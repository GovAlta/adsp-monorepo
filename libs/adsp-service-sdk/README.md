# adsp-service-sdk

Node.js SDK for building services on the Alberta Digital Service Platform (ADSP). Tenant product teams use
it to build services for their own tenant; platform teams use it to build multi-tenant platform services.
It is published to npm as `@abgov/adsp-service-sdk`.

## Install

```bash
npm i @abgov/adsp-service-sdk
```

Inside this monorepo, import it by the `@abgov/adsp-service-sdk` path alias in `tsconfig.base.json`.

## Usage

The SDK needs a confidential Keycloak client with a service account. See
[Setting up a service account](../../docs/platform/platform-node-sdk.md#setting-up-a-service-account).

### Tenant service: `initializeService`

Use `initializeService` for a service that runs in a single tenant. Pass the tenant's realm; the service
account token determines the tenant.

```typescript
import { AdspId, initializeService } from '@abgov/adsp-service-sdk';
import * as passport from 'passport';

const serviceId = AdspId.parse(environment.CLIENT_ID); // e.g. urn:ads:my-tenant:my-service
const { tenantStrategy, configurationHandler, eventService, healthCheck } = await initializeService(
  {
    serviceId,
    displayName: 'My service',
    description: 'Example of a tenant service.',
    realm: environment.TENANT_REALM,
    clientSecret: environment.CLIENT_SECRET,
    accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
    directoryUrl: new URL(environment.DIRECTORY_URL),
    roles: [],
    events: [],
  },
  { logger },
);

passport.use('tenant', tenantStrategy);
```

`initializeService` returns the same capabilities as `initializePlatform`, except `tenantService` and
`tenantHandler`. Its `configurationHandler` and `metricsHandler` are bound to the service's own tenant, and
`clearCached(serviceId)` takes only a service ID.

### Platform service: `initializePlatform`

Use `initializePlatform` for a multi-tenant platform service. It always uses the `core` realm, so it does not
take a `realm` option; its `tenantStrategy` accepts tokens from any tenant realm.

```typescript
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';

const serviceId = AdspId.parse(environment.CLIENT_ID); // e.g. urn:ads:platform:my-service
const { coreStrategy, tenantStrategy, tenantHandler, configurationHandler } = await initializePlatform(
  {
    serviceId,
    displayName: 'My platform service',
    description: 'Example of a platform service.',
    clientSecret: environment.CLIENT_SECRET,
    accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
    directoryUrl: new URL(environment.DIRECTORY_URL),
    configuration: { schema: configurationSchema, description: 'Configuration of my service.' },
    events: [],
    roles: [],
    notifications: [],
  },
  { logger },
);
```

An optional third argument injects existing `directory`, `tenantService`, `configurationService`,
`eventService` or `auditService` implementations.

The second argument is either a winston `Logger` or `{ logger?, logLevel? }`; without a logger, the SDK
creates one.

### Options

Both functions take the `ServiceRegistration` fields, which the SDK registers with the platform
asynchronously on startup:

- `serviceId`, `displayName`, `description` (required).
- `roles`, `configuration` (`configurationSchema` is deprecated), `events`, `eventStreams`, `fileTypes`,
  `notifications`, `values`, `auditActions`, and `serviceConfigurations` for other platform services.

Connection options: `clientSecret`, `accessServiceUrl`, `directoryUrl`, and `realm` (`initializeService`
only). Optional: `configurationConverter`, `combineConfiguration`, `enableConfigurationInvalidation`,
`useLongConfigurationCacheTTL`, `additionalExtractors`, `tracing`, `metrics`, `audit`, and `ignoreServiceAud`
(`initializePlatform` only).

### Capabilities

| Capability                                     | Description                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `tenantStrategy`, `coreStrategy`               | Passport strategies that verify tenant and core bearer tokens.               |
| `tenantHandler`                                | Express middleware that sets `req.tenant` (`initializePlatform` only).       |
| `tenantService`                                | Client for tenant information (`initializePlatform` only).                   |
| `configurationHandler`, `configurationService` | Middleware that adds `req.getConfiguration()`, and the configuration client. |
| `clearCached`                                  | Clears cached configuration.                                                 |
| `directory`                                    | Service directory for looking up service and API URLs.                       |
| `eventService`                                 | Sends domain events.                                                         |
| `auditService`                                 | Records and queries audit events.                                            |
| `tokenProvider`                                | Provides the service account access token.                                   |
| `healthCheck`                                  | Checks the health of platform dependencies.                                  |
| `metricsHandler`, `traceHandler`               | Express middleware for request metrics and trace context.                    |
| `tracerProvider`, `meterProvider`              | OpenTelemetry providers, set when `tracing` or `metrics` is configured.      |
| `shutdownTelemetry`                            | Flushes and shuts down telemetry; registered on SIGTERM and SIGINT.          |
| `logger`                                       | Logger used by SDK components.                                               |

## Audit

Define audit actions with the shared constants, register them with `auditActions`, and record events with
`auditService`:

```typescript
import {
  AuditAction,
  AuditCategories,
  AuditSeverities,
  BuiltInRetentionClasses,
  initializeService,
} from '@abgov/adsp-service-sdk';

const UPDATE_CASE: AuditAction = {
  name: 'case.update',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
};

const { auditService } = await initializeService({ ...serviceOptions, auditActions: [UPDATE_CASE] }, { logger });

const outcome = await auditService.record(UPDATE_CASE, { actor: { id: user.id, type: 'user' } });
if (outcome.status !== 'recorded') {
  logger.warn(`Audit event ${outcome.eventId} was not recorded: ${outcome.reason}`);
}
```

`AuditCategory` and `AuditSeverity` are string unions derived from the constants, so string literals remain
compatible. `retentionClass` is a string: applications may use custom class names such as `case-history` when
a matching retention period is configured. Built-in class constants specify names, not retention periods.

By default, each event is sent immediately in its own HTTP request. `record()` never rejects; `recorded`
means the service confirmed storage or an idempotent duplicate. Once all calls have settled, no `flush()` is
needed, but shutdown must still wait for in-flight requests.

For high-throughput workloads, opt into client-side batching with the `audit` option:

```typescript
const { auditService } = await initializeService(
  { ...serviceOptions, auditActions: [UPDATE_CASE], audit: { batchSize: 100, batchIntervalMs: 500 } },
  { logger },
);
```

Batching is enabled when `batchSize` is greater than 1; partial batches wait up to `batchIntervalMs` (500 ms
by default). Before shutdown, call `await auditService.flush()` if batches or unawaited records remain.

Both modes bound in-flight and retry memory, retry transient failures with the same `eventId`, and report the
`audit.client.dropped_events` metric. A failed delivery may already have been stored if its response was lost;
resend it with the same `eventId`. `AuditClientOptions` types the `audit` option, including request timeouts
and retry delays. See the [Audit service documentation](../../docs/services/audit-service.md).

## Reference

Main exports from `src/index.ts`:

- **Initialization**: `initializeService`, `initializePlatform`.
- **Registration types**: `ServiceRegistration`, `ServiceRole`, `DomainEventDefinition`, `NotificationType`,
  `Channel`, `FileType`, `ValueDefinition`, `Stream`.
- **Access**: `authorize`, `isAllowedUser`, `hasRequiredRole`, `AssertRole`, `AssertCoreRole`,
  `UnauthorizedUserError`, `User`, `TokenProvider`.
- **Audit**: `AuditCategories`, `AuditSeverities`, `BuiltInRetentionClasses`, `auditDetailsFromRequest`,
  `toAuditActor`, `AuditAction`, `AuditService`, `AuditClientOptions`.
- **Service clients (types)**: `ServiceDirectory`, `TenantService`, `Tenant`, `ConfigurationService`,
  `EventService`, `DomainEvent`.
- **Utilities**: `AdspId`, `adspId`, `GoAError`, `createErrorHandler`, `createValidationHandler`,
  `ValidationFailedError`, `retry`, `LimitToOne`, `toKebabName`.
- **Telemetry**: `instrumentJob`, `recordCacheResult`, `benchmark`, `startBenchmark`, `instrumentAxios`,
  `getContextTrace`.

## Development

```bash
npx nx test adsp-service-sdk
npx nx lint adsp-service-sdk
npx nx build adsp-service-sdk
```

The package is released to npm by semantic-release through the `release` target. Use conventional commits
with the project name as the scope, for example `fix(adsp-service-sdk): ...`; see [AGENTS.md](../../AGENTS.md).

## Links

- [Service SDK (Node.js) guide](../../docs/platform/platform-node-sdk.md), also on
  [GitHub Pages](https://govalta.github.io/adsp-monorepo/platform/platform-node-sdk.html).
- [ADSP Development Guide](https://govalta.github.io/adsp-monorepo).
