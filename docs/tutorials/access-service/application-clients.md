---
title: Application Clients
layout: page
nav_order: 2
parent: Access Service
grand_parent: Tutorials
---

## Configuring Clients for ADSP API access

Although most of the keycloak configuration is done when a tenant is set up, you will still need to create new _clients_ for you applications. Clients are used to obtain access tokens for _authentication_ and _authorization_, and the ADSP API requires that your client is authorized to access its resources. To configure your clients, log in to ADSP's [Tenant Admin Webapp](https://adsp-uat.alberta.ca) and select the access service tab:

![](/adsp-monorepo/assets/access-service/access-service.png){: width="400" }

Then click on the _Keycloak admin portal_ link, which will bring you to the Keycloak admin page:

![](/adsp-monorepo/assets/access-service/select-keycloak.png){: width="400" }

Now, create a new client in Keycloak, giving it an appropriate name for your application. Be sure to give your client a _confidential_ access type, and _enable service accounts_:

![](/adsp-monorepo/assets/access-service/client-config.png){: width="400" }

when service accounts are enabled you will see a new tab on the client page - _Service Account Roles_:

![](/adsp-monorepo/assets/access-service/client-tabs.png){: width="600" }

_Service accounts_ provide programmatic access to Keycloak's APIs. In particular, the service account for the client is used when your applications logs in to keycloak and requests an access token. Based on the roles configured in the account, the token will grant access (or not) to the requested resources when you call an ADSP Service API.

As an example, suppose you want to use ADSP's [PDF Service](/adsp-monorepo/tutorials/pdf-service/introduction.html). You will need to give your new client the _pdf-generator_ role as follows. Click on the _Service Account Roles_ tab and select the urn:ads:platform:pdf-service client:

![](/adsp-monorepo/assets/access-service/account-roles.png){: width="400" }

In this example, there is only one role for the service, the _pdf-generator_. Other services may have more than one role needed to access all of its resources. Click on the role, then _Add Selected_, and your client will now be able to effectively make use of the PDF Service.

## Fetching access tokens

Once you have a client set up you can us it to obtain the _access tokens_ you need to call the ADSP API's. You will need:

- the client ID,
- the client secret, and
- the realm (or tenant) ID

You can grab an access token as follows:

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
