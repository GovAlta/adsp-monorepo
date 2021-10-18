---
layout: page
title: Configuration service
nav_order: 3
parent: Services
---

# Configuration service
Configuration service provides a store for infrequently changing configuration and includes a concept of revisions to support 'version locking' of configuration. The service can store arbitrary json objects as configuration with support for optional write-time validation using json schemas.

## Client roles
client `urn:ads:platform:configuration-service`

| name | description |
|:-|:-|
| configuration-admin | Administrator role for configuration service. This role grants read and write access to configuration. It is part of the tenant-admin composite role and allows tenant administrators to configure platform services. |
| configuration-reader | Reader role for configuration service. This role is used to allow service accounts to read configuration. |

## Concepts
### Configuration definition
Configuration definition is an optional metadata description for a particular *configuration* (identified by a specific namespace and name). The definition provides write-time validation via json schema. Configuration definitions are configured in the [configuration service](configuration-service.md) under the `platform:configuration-service` namespace and name.

### Configuration
Configuration stores values represented by a json object at a particular namespace and name. Configuration includes *revisions* that represent current and past value snapshots.

### Revision
Revisions are specific snapshots of *configuration*. Updates to configuration values are applied to the latest revision and the current value is captured in a snapshot when a new revision is created. This can be used to version lock configuration for consumers; the configured application should request a specific revision use deployment parameterization mechanisms, like environment variables, to allow for updating to later revisions.

## Code examples
### Read a revision of configuration
```typescript
  const configurationServiceUrl = 'https://configuration-service.alpha.alberta.ca';
  const namespace = 'support';
  const name = 'formula-values';
  const response = await fetch(
    `${configurationServiceUrl}/configuration/v2/configuration/${namespace}/${name}/revisions/1`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );
  const configuration = await response.json();
```

### Update configuration
Updates are applied to the latest revision of configuration.
```typescript
  const configurationServiceUrl = 'https://configuration-service.alpha.alberta.ca';
  const namespace = 'support';
  const name = 'formula-values';
  const request = {
    operation: 'UPDATE',
    update: {
      valueA: 'this is a configuration value',
      valueB: 123,
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v1/configuration/${namespace}/${name}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    }
  );
```

### Create a revision
Create a revision to snapshot the latest configuration. The snapshot cannot be modified afterwards.
```typescript
  const configurationServiceUrl = 'https://configuration-service.alpha.alberta.ca';
  const namespace = 'support';
  const name = 'formula-values';

  await fetch(
    `${configurationServiceUrl}/configuration/v1/configuration/${namespace}/${name}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({revision: true}),
    }
  );
```
