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

See [ADSP Development Guide](https://glowing-parakeet-0563ab2e.pages.github.io) for details.
