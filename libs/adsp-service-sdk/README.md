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
