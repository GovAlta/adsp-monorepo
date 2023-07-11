---
title: ADSP Clients
layout: page
nav_order: 4
parent: Access Service
grand_parent: Tutorials
---

## API Security

ADSP clients are bearer-only clients. This means that you cannot use these clients to retrieve access tokens for your application work. In fact, the only reason these clients have been configured in your tenant is to add additional security when making ADSP API calls.

### Configuring an Application Client

When you want to use one or more ADSP services from you application you will need to set up an _Application Client_ in keycloak.

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
