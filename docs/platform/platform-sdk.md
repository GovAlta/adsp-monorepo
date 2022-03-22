---
layout: page
title: Platform service SDK
nav_order: 2
parent: Platform development
---

<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

# Platform service SDK
Platform services integrate into the foundational capabilities via a Software Development Kit (SDK). The SDK includes interfaces and utilities for handling tenancy, configurations, and registration. Note that the SDK provides friendly interfaces on top of APIs. It is intended to speed up platform service development but is not the only way to access platform capabilities. Currently the SDK is only available for NodeJS.

## Generating service
The ADSP project includes a [workspace generator](https://nx.dev/l/r/generators/workspace-generators) for creating new express based backend services. The base template includes usages of SDK capabilities and is a good starting point for understanding the SDK.

Generate a new service by running:
```bash
npx nx workspace-generator adsp-service
```

The generate output includes sub-project structure and initial files under `/apps` as well as deployment manifests under `.openshift/managed` and `.compose`.

## Initializing the SDK
SDK capabilities are access via the `initializePlatform` function. It takes service metadata as inputs and returns an object with the initialized platform interfaces and utilities.

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

## Authorizing requests
The SDK provides [Passport](https://www.passportjs.org/) strategies for verifying JWT bearer tokens in tenant and core realm requests.

Verify tenant bearer token:
```typescript
  const {
      tenantStrategy,
      ...sdkCapabilities,
    } = await initializePlatform(parameters);

  passport.use('tenant', tenantStrategy);
  const authenticateHandler = passport.authenticate(['tenant'], { session: false });
```

### Using the core strategies
Core requests are used by platform services making requests to other platform services under a service account. However, users may have core accounts as well. Services should only use the core strategy when requests from a core context is expected, and should enforce role-based access controls on operations.

```typescript
  const {
      coreStrategy,
      ...sdkCapabilities,
    } = await initializePlatform(parameters);

  passport.use('core', coreStrategy);
  const authenticateHandler = passport.authenticate(['core'], { session: false });
```

### Service specific user roles
Keycloak issued tokens contain client roles nested under `realm_access`. Both tenant and core strategies flatten service specific roles from the token and exclude roles related to other service clients.

This means that service should define their roles in SDK initialization so the roles are created as roles under the service specific client. For services that allow users to configure which roles have what access, those roles must either be realm roles or roles added under the service client.

## Determining tenancy
Requests to platform services are in the context of a specific tenant with few exceptions. The context is implicit when a request is made with a tenant bearer token. It can be explicit in cases where an endpoint allows anonymous access or when a platform service makes a request to another platform service under a core service account.

The SDK provides a request handler that resolves implicit from user tenancy and explicit from a `tenantId` query parameter. Resolved tenant is set on the request object; no value is set if tenancy cannot be resolved.

Getting tenancy using the tenant request handler:
```typescript
  const {
    tenantHandler,
    ...sdkCapabilities
  } = await initializePlatform(parameters);

  app.use(
    '/my-resource',
    authenticateHandler,
    tenantHandler,
    (req, res) => { res.send(req.tenant) }
  );
```

The handler uses the tenant service client to retrieve tenant information. This is also available from the SDK for direct use.

Getting tenant information using the tenant service:
```typescript
  const {
    tenantService,
    ...sdkCapabilities
  } = await initializePlatform(parameters);

  app.use(
    '/my-resource',
    authenticateHandler,
    async (req, res) => {
      const tenant = await tenantService.getTenant(req.user.tenantId);
      res.send(tenant);
    }
  );
```

## Finding services
Service discovery in ADSP is handled using client side service discovery with a directory of services providing a register of available services.

Getting a service URL from the directory:
```typescript
  const {
    directory,
    ...sdkCapabilities,
  } = await initializePlatform(parameters);

  const serviceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:event-service`);
```

## Handling configuration
Platform services can make use of a common configuration service for managing configuration. The SDK allows services to define their configuration schema and access configuration.

Defining the configuration json schema:
```typescript
  const {
    configurationHandler,
    configurationService,
    ...sdkCapabilities,
  } = await initializePlatform({
      configurationSchema: {
        type: 'object',
        properties: {
          types: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' }
              },
              required: ['name'],
            }
          }
        }
      },
      ...parameters,
  });

  const serviceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:event-service`);
```

Each service can have core configuration that applies across tenants and configuration specific to each tenant. The SDK provides a configuration request handler that will retrieve configuration for in the request tenant context.

Defining the configuration json schema:
```typescript
  const {
    configurationHandler,
    ...sdkCapabilities,
  } = await initializePlatform(parameters);

  app.use(
    '/my-resource',
    authenticateHandler,
    tenantHandler,
    configurationHandler,
    async (req, res) => {
      const [tenantConfig, coreConfig] = await req.getConfiguration<MyServiceConfiguration>();
      res.send(tenantConfig);
    }
  );
```
The tenant context is based on `req.tenant` set by the tenant request handler when available and falls back to `req.user.tenantId`.

The handler uses configuration service client to retrieve configuration. This is also available from the SDK for direct use.

Getting configuration using the configuration service:
```typescript
  const {
    configurationService,
    ...sdkCapabilities,
  } = await initializePlatform(parameters);

  app.use(
    '/my-resource',
    authenticateHandler,
    tenantHandler,
    async (req, res) => {
      const [tenantConfig, coreConfig] = await configurationService.getConfiguration<MyServiceConfiguration>(
        serviceId,
        accessToken,
        tenantId,
      );
      res.send(tenantConfig);
    }
  );
```

### Converting configuration
Services may want to apply transformations on the retrieved configuration. The SDK allows services to provide functions for converting and combining core and tenant configuration. For example, services can use these to generate effective configuration when tenant overrides parts of core configuration.

Provide conversion functions:
```typescript
  const {
    configurationHandler,
    configurationService,
    ...sdkCapabilities,
  } = await initializePlatform({
      configurationSchema,
      configurationConverter: (config, tenantId) => new MyConfigurationEntity(config, tenantId),
      combineConfiguration: (
        tenantConfig: MyConfigurationEntity,
        coreConfig: MyConfigurationEntity,
        tenantId
      ) => tenantConfig.merge(coreConfig),
      ...parameters,
  });

  app.use(
    '/my-resource',
    authenticateHandler,
    tenantHandler,
    configurationHandler,
    async (req, res) => {
      const effectiveConfig = await req.getConfiguration<MyServiceConfiguration, MyConfigurationEntity>();
      res.send(effectiveConfig);
    }
  );
```
`configurationConverter` is called for both core and tenant configuration then the results are input into `combineConfiguration`.

## Registering event definitions, notification types, etc.
The SDK allows services to register configuration for some platform services.

- `roles` defines the client roles of the service. New tenant realms are created with a client that includes the roles specified here.
- `events` defines the domain events of the service.
- `notifications` defines the notification types of the service.

Defining configuration for other platform services:
```typescript
  const {
    ...sdkCapabilities,
  } = await initializePlatform({
    roles: [{
      name: 'my-service-admin',
      description: 'Administrator role for my-service.',
      inTenantAdmin: true,
    }],
    events: [{
      name: 'intake-submitted',
      description: 'Signalled when an intake is submitted',
      payloadSchema: {
        type: 'object',
        properties: {
          submitter: {
            type: 'string'
          }
        }
      }
    }],
    notifications: [{
      name: 'intake-updates',
      description: 'Provides updates on intake application.',
      publicSubscribe: false,
      subscriberRoles: [],
      channels: [Channel.email],
      events: [{
        namespace: 'my-service',
        name: 'intake-submitted',
        templates: {
          [Channel.email]: {
            subject: 'Intake submitted',
            body: 'Hi {{ event.payload.submitter }}, Your intake was submitted.',
          }
        }
      }],
    }],
    ...parameters,
  });
```

## Additional utilities
The SDK provides several other useful utilities.

### ADSP ID
Utilities for handling ADSP URNs.

Parse and convert urns:
```typescript
  import { adspId, AdspId } from '@abgov/adsp-service-sdk';

  const dynamicAdspId = AdspId.parse(dynamicId);
  const staticAdspId = adspId`urn:ads:platform:task-service`;
```

### Role-based authorization

### Platform health check
Include platform service checks in the service health check endpoint.
```typescript
  const {
    healthCheck,
    ...sdkCapabilities,
  } = await initializePlatform(parameters);

   app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json(platform);
  });
```

### Errors and error handler
Use a standard error handler:
```typescript
  import { createErrorHandler } from '@abgov/adsp-service-sdk';

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);
```

### Logging
Import a standard logger for platform services:
```typescript
  import { createLogger } from '@abgov/adsp-service-sdk';
  const logger = createLogger('my-service', environment.LOG_LEVEL);
```
