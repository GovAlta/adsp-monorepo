---
layout: page
title: Access service
nav_order: 2
parent: Services
---

# Access service
Access service is a deployment of [Keycloak](https://www.keycloak.org/). It provides *Realms* (tenancy in Keycloak) to tenants and serves as the basis for tenant access management.

Access tokens issued by tenant realms are recognized by platform services and serve to identify the associated tenant of each request. Tenant administrators control the user and service accounts that have access to platform capabilities by adding or removing platform service client roles from accounts.

## Client roles
Access service roles are defined by Keycloak. Realm management related roles can be found under the `realm-management` client. Refer to keycloak documentation for specifics.

## Concepts
This captures some key concepts and their specific relevance to ADSP. For the complete documentation, refer to Keycloak documentation.

### Clients
Clients represents applications that request authentication for users or applications that verify access via bearer tokens. In ADSP, tenant realms are created with a `urn:ads:platform:tenant-admin-app` client that is used by the tenant administration application to authenticate users, as well as platform service bearer-only clients that include *client roles*.

### Clients roles
Client roles are roles associated with a specific client. For example, Keycloak realm administration console roles are client roles of a `realm-management` client. If an access token is requested for an account with a client role, the *Audience Resolve* protocol mapper included in the *roles* scope will include the client in the `aud` field of the returned access token.

## Code examples
### Authenticate user
TODO: Add example here

See [Angular Example](https://github.com/abgov/dio-keycloak-angular-sample)

See [React Example](https://github.com/abgov/nx-tools-example/tree/actions-pipeline/apps/react-dotnet-example-app)

### Request a service account access token
Platform capabilities are often access via their API under a service account. Retrieve an access token for your client using the `client_credentials` grant.

```typescript
  const response = await fetch(
    `https://access.alpha.alberta.ca/auth/realms/${realm}/protocol/openid-connect/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': clientId,
          'client_secret': clientSecret,
      }),
    }
  );

  const {
    access_token,
    expires_in,
  } = await response.json();
```
