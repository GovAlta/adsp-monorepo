---
title: Introduction
layout: page
nav_order: 1
parent: Access Service
grand_parent: Tutorials
---

## Getting Started

ADSP services require that you and your application have access to a keycloak _Tenant_, or realm, on the production and, if desired, UAT servers. This is because:

- Service API calls require authentication, provided through keycloak access tokens, and
- you will need to log in to our Tenant Management Webapp in order to configuring a Service

Many applications and application groups already have Tenancy in keycloak. If that's the case you need only ensure that you have been added as a user. If you have not, someone on your team will be able to do so.

### Create a new Tenant

If your team does not already have a tenant set up for its applications then [contact the ADSP team](mailto:adsp@gov.ab.ca) to help you through the process. We will simply assign a team member the _beta-tester_ role, and they will be able to [create a tenant](https://adsp.alberta.ca/).

### Tenant Admin Webapp

As a Tenant user, you can log in to the [Tenant Admin Webapp](https://adsp.alberta.ca/) and configure the services of interest to meet the needs of your application. For example, you would use the webapp to build templates for the [PDF Service](/adsp-monorepo/tutorials/pdf-service/introduction.html), or add File Type collections in the [File Service](/adsp-monorepo/tutorials/file-service/introduction.html). The [Tenant Admin Webapp](https://adsp.alberta.ca/) is the place to go to setup ADSP services.

### Application Login

ADSP services are API based and require authentication. You will need to add you application as a client in your Keycloak realm, and give it the access roles it needs to call the various service APIs. To make an API call you will need:

- a client ID, and
- a client secret

which are used when requesting access tokens from keycloak to use when making an API call. Using your Keycloak realm (or tenant) Id, your application's client Id, and client secret you can grab an access token as follows:

```typescript
const accessUrl = `https://access.alberta.ca/auth/realms/${realmID}/protocol/openid-connect/token`;
const response = await fetch(accessUrl, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }),
});

const { access_token, expires_in } = await response.json();
```

Access tokens returned by the fetch are valid for about 5 minutes and can be used in API calls until they expire. You can, however, refresh them if needed, or just grab new ones.
