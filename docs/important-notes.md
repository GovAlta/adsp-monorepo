---
layout: page
title: Important notes
nav_order: 2
---
# Important notes
## Configuration caching
ADSP consists of interconnected micro-services. Caching is used extensively to limit synchronous coupling and chatter between services.

Configuration service is used by multiple platform services to store relatively static configuration. Platform services cache their configuration with a long TTL and use configuration events for cache invalidation. In practice, this means that configuration changed within tenant administration may not immediately be applied, but should catch up once any stale cache entry is invalidated.

## Open API site and client credentials
ADSP includes a Swagger UI based [API documentation site](https://api.adsp.alberta.ca) that includes tenant specific OpenID Connect configuration for authorizing requests. When using 'Try it out' from this site, the requests are made from the frontend and so the realm configuration must include this site in Web Origins (for CORS) and in Redirect URLs if using a frontend flow. Tenant realms are created with a `api-app-client` client that can be used with authorization code sign in; enable the client to use it.

## Access management
ADSP capabilities are provided by micro-services that recognize and accept your tenant realm's access tokens. This means that the tenant realm administrators can grant platform service specific permissions to any user or service accounts in their realm.

The platform service roles are automatically included as *Client Roles* when your tenant realm is created. They can be found under the bearer-only *Clients* with a naming convention of: `urn:ads:platform:{x-service}`.

**To see some of these clients**
1. From Keycloak realm administration, select *Clients* and find the clients with the above naming convention.
2. Select one of these clients and the *Roles* tab to see associated roles.

New platform roles are introduced as new platform services are added, and tenants can review and add them from the tenant administration in the Service roles tab of Access service.

### Token audience

Platform services verify the token signature and verify that the service client ID is included in the `audience`. When using the pre-populated client roles with the base realm configuration, the client ID is automatically resolved and included in the token; this is handled by the *Audience Resolve* protocol mapper included in the *roles* scope. However, if you are using the configurable access capabilities of some services (e.g. `task-service` queue `workerRoles`), then you must configure the client that retrieves the token to include the target platform service in the audience with an *Audience Mapper*.

**To add to audience**
1. From Keycloak realm administration, select *Clients* and find the client that will request the access token.
2. Open the client and select the *Mappers* tab.
3. Click *Create* to create a new mapper.
4. For *Mapper Type*, select *Audience*, then select the client corresponding the the platform service that will be accessed.
