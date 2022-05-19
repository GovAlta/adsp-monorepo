---
layout: page
title: Directory service
nav_order: 3
parent: Services
---

# Directory service

Directory service is a register of services and APIs. It allows you to find service URLs matched to logical URNs of the form: `urn:ads:{namespace}:{service}:{api}`. Consumers can use this service for client-side service discovery.

## Client roles

client `urn:ads:platform:directory-service`

| name            | description                                                                                            |
| :-------------- | :----------------------------------------------------------------------------------------------------- |
| directory-admin | Administrator role for directory service. This role allows administrators to modify directory entries. |

The directory service API allows anonymous read access of entries.

## Concepts

### Entry

Entries represent a registered service or API in the directory. Tenant entries are created under a tenant namespace based on the tenant name.

## Code examples

### Reading the directory

```typescript
const response = await fetch('https://directory.adsp.alberta.ca/directory/v2/namespaces/platform/entries', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const entries = await response.json();
```
